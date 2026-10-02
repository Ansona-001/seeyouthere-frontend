"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

const MAX_DIMENSION = 2560;
const JPEG_QUALITY = 0.85;

/**
 * Downsizes client-side before upload (build-out plan §11.4): this drops
 * EXIF/GPS before the bytes ever leave the browser and shrinks typical phone
 * photos well under the server's 8 MiB cap. The server still enforces every
 * limit independently — this is a courtesy, not a security boundary.
 */
/**
 * Exported so the host editor's media picker (`src/app/edit/[id]/media-field.tsx`)
 * can reuse the exact same client-side downscale before uploading host media
 * (build-out plan §11.4) instead of duplicating it.
 */
export async function downscaleToJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported");
    ctx.drawImage(bitmap, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image"))),
        "image/jpeg",
        JPEG_QUALITY,
      );
    });
  } finally {
    bitmap.close();
  }
}

export function PhotoUpload({ slug, mode }: { slug: string; mode: "live" | "preview" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const disabled = mode === "preview";

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || disabled) return;
    setError(null);
    setPending(true);
    try {
      const jpeg = await downscaleToJpeg(file);
      await api<{ id: string; moderation_status: string }>(`/v1/public/events/${encodeURIComponent(slug)}/photos`, {
        method: "POST",
        body: jpeg,
        headers: { "Content-Type": "image/jpeg" },
      });
      setUploadedCount((n) => n + 1);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Couldn’t process or upload that photo. On an iPhone, try choosing "Most Compatible" for the format.',
      );
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={pending || disabled}
        className="sr-only"
        id={`photo-upload-${slug}`}
      />
      <Button
        type="button"
        disabled={pending || disabled}
        onClick={() => inputRef.current?.click()}
        className="bg-(--ev-accent) text-(--ev-accent-text) hover:opacity-90"
      >
        {pending ? "Uploading…" : "Add a photo"}
      </Button>
      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}
      {uploadedCount > 0 && (
        <p role="status" className="text-center text-sm text-(--ev-muted)">
          {uploadedCount === 1 ? "Photo sent" : `${uploadedCount} photos sent`} — it&apos;ll appear here once the host
          approves it.
        </p>
      )}
    </div>
  );
}
