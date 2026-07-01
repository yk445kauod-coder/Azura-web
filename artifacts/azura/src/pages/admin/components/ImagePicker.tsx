import React, { useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { compressToBase64, base64SizeKB } from "@/lib/imageUtils";
import { swalError } from "@/lib/swal";

const IMG_INPUT_CLS = "input-field px-3 py-2.5 text-sm";

export function ImagePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      swalError("Please select a valid image file (JPG, PNG, WebP…).");
      return;
    }
    setCompressing(true);
    try {
      const b64 = await compressToBase64(file, 600, 0.78);
      if (b64 && b64.startsWith("data:image/")) {
        onChange(b64);
      } else {
        throw new Error("Invalid base64 result");
      }
    } catch (err) {
      console.error("Compression error:", err);
      swalError("Could not compress image. The file might be corrupted or too large. Try a different file.");
    }
    setCompressing(false);
  };

  const isBase64 = value?.startsWith("data:");
  const sizeKB = isBase64 ? base64SizeKB(value) : 0;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[10px] font-bold text-muted-foreground uppercase">
          {label}
        </label>
      )}

      {value && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border bg-muted/40 group">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0.25";
            }}
            loading="lazy"
          />
          {isBase64 && (
            <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-mono">
              📷 {sizeKB} KB
            </span>
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={compressing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 flex-shrink-0 whitespace-nowrap"
        >
          {compressing ? (
            <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          ) : (
            <ImageIcon size={13} />
          )}
          {compressing ? "Compressing…" : "Upload Photo"}
        </button>
        <input
          type="text"
          className={`${IMG_INPUT_CLS} flex-1 text-[11px] py-2`}
          placeholder="…or paste image URL"
          value={isBase64 ? "" : value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
