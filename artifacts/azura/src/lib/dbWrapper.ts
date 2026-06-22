import { db, ref, get, set, update, push, remove, onValue, off } from "./firebase";
import { initR2, uploadToR2, downloadFromR2, R2Config } from "./r2";

export type DBMode = "firebase" | "r2";

let mode: DBMode = "firebase";
let r2Config: R2Config | null = null;
const fallbackListeners: Set<() => void> = new Set();

export function setDBMode(m: DBMode) {
  if (mode !== m) {
    mode = m;
    fallbackListeners.forEach(l => l());
  }
}

export function getDBMode() { return mode; }

export function onModeChange(cb: () => void) {
  fallbackListeners.add(cb);
  return () => fallbackListeners.delete(cb);
}

async function getR2Config() {
  if (r2Config) return r2Config;

  // Try localStorage first (for fallback mode persistence)
  const local = localStorage.getItem("azura-r2-config");
  if (local) {
    try {
      r2Config = JSON.parse(local);
      if (r2Config) initR2(r2Config);
      return r2Config;
    } catch (e) {}
  }

  // Try Firebase
  try {
    const snap = await get(ref(db, "r2-config"));
    if (snap.exists()) {
      r2Config = snap.val();
      if (r2Config) {
        localStorage.setItem("azura-r2-config", JSON.stringify(r2Config));
        initR2(r2Config);
      }
      return r2Config;
    }
  } catch (e) {
    console.warn("Could not load R2 config from Firebase", e);
  }
  return null;
}

export function saveR2Locally(config: R2Config) {
  r2Config = config;
  localStorage.setItem("azura-r2-config", JSON.stringify(config));
  initR2(config);
}

// Global state for fallback
const r2Cache: Record<string, any> = {};

export async function smartGet(path: string) {
  if (mode === "firebase") {
    try {
      const snap = await get(ref(db, path));
      return snap.exists() ? snap.val() : null;
    } catch (e) {
      console.error("Firebase Get Failed, switching to R2 Fallback", e);
      setDBMode("r2");
    }
  }

  if (mode === "r2") {
    const config = await getR2Config();
    if (!config) throw new Error("R2 Not Configured");

    // Attempt to get from R2
    try {
      const data = await downloadFromR2(`${path}.json`);
      r2Cache[path] = data;
      return data;
    } catch (e) {
      return r2Cache[path] || null;
    }
  }
}

export async function smartSet(path: string, data: any) {
  if (mode === "firebase") {
    try {
      await set(ref(db, path), data);
      // Also update R2 in background if configured
      const config = await getR2Config();
      if (config) uploadToR2(`${path}.json`, data).catch(console.error);
      return;
    } catch (e) {
      console.error("Firebase Set Failed, switching to R2 Fallback", e);
      setDBMode("r2");
    }
  }

  if (mode === "r2") {
    const config = await getR2Config();
    if (!config) throw new Error("R2 Not Configured");
    r2Cache[path] = data;
    return uploadToR2(`${path}.json`, data);
  }
}

export async function smartUpdate(path: string, data: any) {
  if (mode === "firebase") {
    try {
      await update(ref(db, path), data);
      // Sync full node to R2
      const config = await getR2Config();
      if (config) {
        const fullSnap = await get(ref(db, path));
        uploadToR2(`${path}.json`, fullSnap.val()).catch(console.error);
      }
      return;
    } catch (e) {
      console.error("Firebase Update Failed, switching to R2 Fallback", e);
      setDBMode("r2");
    }
  }

  if (mode === "r2") {
    const config = await getR2Config();
    if (!config) throw new Error("R2 Not Configured");

    const existing = await smartGet(path) || {};
    const merged = { ...existing, ...data };
    r2Cache[path] = merged;
    return uploadToR2(`${path}.json`, merged);
  }
}

export async function smartPush(path: string, data: any) {
  if (mode === "firebase") {
    try {
      const res = push(ref(db, path));
      await set(res, data);
      return res.key;
    } catch (e) {
      setDBMode("r2");
    }
  }

  if (mode === "r2") {
    const id = `r2_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const existing = await smartGet(path) || {};
    existing[id] = data;
    await smartSet(path, existing);
    return id;
  }
}

export async function smartRemove(path: string) {
  if (mode === "firebase") {
    try {
      await remove(ref(db, path));
      return;
    } catch (e) {
      setDBMode("r2");
    }
  }

  if (mode === "r2") {
    // Handling removal in R2 is tricky if path is a child
    // For simplicity, we assume root-ish paths or handle them via smartGet/Set
    const parts = path.split('/');
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const childKey = parts[parts.length - 1];
      const parentData = await smartGet(parentPath);
      if (parentData && parentData[childKey]) {
        delete parentData[childKey];
        return smartSet(parentPath, parentData);
      }
    }
    return uploadToR2(`${path}.json`, null);
  }
}
