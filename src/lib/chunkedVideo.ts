/**
 * Chunked Video Storage for Firebase RTDB
 * Uses IndexedDB for local caching to reduce RTDB load
 */

const DB_NAME = "AzuraVideos";
const DB_VERSION = 1;
const STORE_NAME = "videos";

// IndexedDB helpers
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function saveToIndexedDB(id: string, videoData: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, data: videoData, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    db.close();
  });
}

export async function getFromIndexedDB(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result?.data || null);
    request.onerror = () => reject(request.error);
    db.close();
  });
}

export async function deleteFromIndexedDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    db.close();
  });
}

// Convert file to base64 chunks
export async function fileToChunks(file: File, onProgress?: (progress: number) => void): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const reader = new FileReader();
    let offset = 0;
    let chunkIndex = 0;
    const totalChunks = Math.ceil(file.size / (512 * 1024)); // 512KB chunks for faster RTDB

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + (512 * 1024));
      reader.readAsDataURL(slice);
    };

    reader.onload = () => {
      chunks.push(reader.result as string);
      offset += (512 * 1024);
      chunkIndex++;
      
      if (onProgress) {
        onProgress(Math.round((chunkIndex / totalChunks) * 100));
      }

      if (offset < file.size) {
        readNextChunk();
      } else {
        resolve(chunks);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    readNextChunk();
  });
}

// Get total size of chunks in MB
export function getChunksSizeMB(chunks: string[]): number {
  const totalBytes = chunks.reduce((acc, chunk) => {
    const base64 = chunk.replace(/^data:[^;]+;base64,/, "");
    return acc + (base64.length * 0.75);
  }, 0);
  return totalBytes / (1024 * 1024);
}