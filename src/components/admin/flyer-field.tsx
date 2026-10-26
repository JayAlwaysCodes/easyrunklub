"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { flyerUrl, MAX_FLYER_BYTES } from "@/lib/uploads";

export function FlyerField({ initialPath }: { initialPath: string | null }) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > MAX_FLYER_BYTES) {
      setError("That image is over 5 MB. Please use a smaller one.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/upload-flyer", { method: "POST", body });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.path) {
        setError(data?.error ?? "Upload failed. Please try again.");
      } else {
        setPath(data.path);
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const url = flyerUrl(path);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Flyer (optional)</p>
      <input type="hidden" name="flyerPath" value={path ?? ""} />

      {url && (
        <div className="relative w-full max-w-xs overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Flyer preview" className="w-full object-cover" />
          <button
            type="button"
            onClick={() => setPath(null)}
            aria-label="Remove flyer"
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent">
        <ImagePlus className="h-4 w-4" />
        {uploading ? "Uploading..." : url ? "Replace flyer" : "Upload flyer"}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          disabled={uploading}
          className="sr-only"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP, up to 5 MB. Wait for the preview to appear before saving.
      </p>
    </div>
  );
}