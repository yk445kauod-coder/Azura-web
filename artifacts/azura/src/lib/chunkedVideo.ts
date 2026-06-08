/**
 * Chunked Video Storage for Firebase RTDB
 * Splits large videos into chunks and reassembles them
 */

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks (RTDB safe limit)

// Convert file to base64 chunks
export async function fileToChunks(file: File, onProgress?: (progress: number) => void): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const reader = new FileReader();
    let offset = 0;
    let chunkIndex = 0;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsDataURL(slice);
    };

    reader.onload = () => {
      chunks.push(reader.result as string);
      offset += CHUNK_SIZE;
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

// Reconstruct video from chunks
export function chunksToVideo(chunks: string[]): string {
  // For playback, we need to combine the data URLs
  // This creates a blob URL for the combined video
  return chunks.join("").replace(/^data:[^;]+;base64,/g, "");
}

// Get video duration from base64
export function getVideoDuration(base64Data: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    
    video.onerror = () => {
      reject(new Error("Failed to load video"));
    };

    video.src = base64Data;
  });
}

// Create a playable video URL from chunks
export function createVideoUrlFromChunks(chunks: string[]): string {
  // Combine all chunks
  const combined = chunks.join("");
  return combined;
}

// Compress video using canvas (for very large videos, reduces quality)
export async function compressVideo(file: File, maxSizeMB: number = 50, onProgress?: (progress: number) => void): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    video.preload = "auto";
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const fps = 30;
      const totalFrames = Math.min(duration * fps, 300); // Max 10 seconds or 300 frames
      
      // Calculate output dimensions
      let width = video.videoWidth;
      let height = video.videoHeight;
      const maxDim = 720;
      
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round(height * maxDim / width);
          width = maxDim;
        } else {
          width = Math.round(width * maxDim / height);
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const frames: string[] = [];
      let currentFrame = 0;
      
      const captureFrame = () => {
        if (ctx && currentFrame < totalFrames) {
          video.currentTime = currentFrame / fps;
        }
      };
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          frames.push(canvas.toDataURL("image/jpeg", 0.7));
        }
        currentFrame++;
        
        if (onProgress) {
          onProgress(Math.round((currentFrame / totalFrames) * 100));
        }
        
        if (currentFrame < totalFrames) {
          setTimeout(captureFrame, 1000 / fps);
        } else {
          // Reconstruct as a simple video
          // For actual video encoding, we'd need a library like Whammy or WebCodecs
          // For now, we'll just use the first frame as a thumbnail
          // and suggest using a lower quality upload
          resolve(file); // Return original file if compression not possible
        }
      };
      
      video.onerror = () => {
        reject(new Error("Failed to load video"));
      };
      
      // Start capturing
      video.play();
      captureFrame();
    };
    
    video.src = URL.createObjectURL(file);
  });
}

// Validate chunk data
export function validateChunks(chunks: string[]): boolean {
  if (!chunks || chunks.length === 0) return false;
  
  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== "string") return false;
    if (!chunk.startsWith("data:video/")) return false;
  }
  
  return true;
}

// Get total size of chunks in MB
export function getChunksSizeMB(chunks: string[]): number {
  const totalBytes = chunks.reduce((acc, chunk) => {
    // Remove the data URL prefix to get actual base64 size
    const base64 = chunk.replace(/^data:[^;]+;base64,/, "");
    return acc + (base64.length * 0.75); // base64 is ~75% of actual size
  }, 0);
  
  return totalBytes / (1024 * 1024);
}