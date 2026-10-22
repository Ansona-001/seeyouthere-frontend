"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

import { downscaleToJpeg } from "@/components/event/photo-upload";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Media, type MediaRef } from "@/lib/api";

/**
 * Host media picker for `image`/`hero`/`gallery` fields (build-out plan
 * §11.4, §4.8). Uploads reuse the exact downscale step `PhotoUpload` uses on
 * the public page, dropping EXIF/GPS client-side before the bytes leave the
 * browser; the server still enforces every limit independently.
 *
 * The upload endpoint isn't built yet in every environment — a 404/501 (or
 * any other failure) surfaces as a plain message instead of breaking the
 * editor, so this field degrades to "not available yet" rather than crashing.
 */
export function MediaField({
  eventId,
  preview,
  onUploaded,
  aspect,
  previewAspect,
  keepRatio = false,
}: {
  eventId: string;
  preview: MediaRef | null;
  onUploaded: (id: string, ref: MediaRef) => void | Promise<void>;
  /** Centre-crop uploads to this width / height ratio. */
  aspect?: number;
  /** Shape of the preview box (width / height); defaults to 16:9. */
  previewAspect?: number;
  /** Show the picture whole in its own shape instead of filling a fixed box. */
  keepRatio?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setPending(true);
    try {
      const jpeg = await downscaleToJpeg(file, { aspect });
      const { media } = await api<{ media: Media }>(`/v1/events/${eventId}/media`, {
        method: "POST",
        body: jpeg,
        headers: { "Content-Type": "image/jpeg" },
      });
      await onUploaded(media.id, { src: media.src, width: media.width, height: media.height });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
        setError("Photo uploads aren't available yet. Please check back soon.");
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't process or upload that image.");
      }
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {preview && (
        <div
          className={`w-full max-w-xs overflow-hidden rounded-lg bg-muted ${previewAspect || keepRatio ? "" : "aspect-video"}`}
          style={keepRatio ? { aspectRatio: `${preview.width} / ${preview.height}` } : previewAspect ? { aspectRatio: previewAspect } : undefined}
        >
          <Image
            src={preview.src}
            alt=""
            width={480}
            height={keepRatio ? Math.max(1, Math.round((480 * preview.height) / preview.width)) : 270}
            className={`size-full ${keepRatio ? "object-contain" : "object-cover"}`}
          />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={pending}
        className="sr-only"
        id={inputId}
      />
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
        {pending ? "Uploading…" : preview ? "Replace image" : "Upload image"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
