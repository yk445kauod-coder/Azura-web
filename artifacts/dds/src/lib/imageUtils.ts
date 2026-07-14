/**
 * Compress an image File to a JPEG base64 data URL.
 * Steps: load → draw on canvas (resize to maxDim) → toDataURL at given quality.
 * Result is safe to store directly in Firebase RTDB.
 *
 * Typical output: 400×400 JPEG at 0.72 quality → ~30-80 KB → base64 ~40-110 KB
 */
export async function compressToBase64(
  file: File,
  maxDim = 400,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Keep aspect ratio; never upscale
      const ratio = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 2D context unavailable")); return; }

      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image failed to load"));
    };

    img.src = url;
  });
}

/** Approximate the byte size of a base64 data URL in kilobytes */
export function base64SizeKB(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? dataUrl;
  return Math.round((base64.length * 3) / 4 / 1024);
}
