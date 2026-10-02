"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api, ApiError, type PhotoItem, type PublicPhotosResponse } from "@/lib/api";

/**
 * Approved guest photos with "Load more" paging (build-out plan §4.4
 * `GET /v1/public/events/{slug}/photos`, 24 per page). Only used in `live`
 * mode with a real `slug` — the editor preview keeps rendering a static
 * grid via `guest-photos-block.tsx`, since there's nothing to page through.
 */
export function PhotoGallery({
  slug,
  initialItems,
  initialCursor,
}: {
  slug: string;
  initialItems: PhotoItem[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await api<PublicPhotosResponse>(
        `/v1/public/events/${encodeURIComponent(slug)}/photos?cursor=${encodeURIComponent(cursor)}`,
      );
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load more photos.");
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-4">
      <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((photo) => (
          <div key={photo.id} className="aspect-square overflow-hidden rounded-lg">
            <Image src={photo.src} alt="" width={480} height={480} className="size-full object-cover" />
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {cursor && (
        <Button type="button" variant="outline" onClick={loadMore} disabled={pending}>
          {pending ? "Loading…" : "Load more photos"}
        </Button>
      )}
    </div>
  );
}
