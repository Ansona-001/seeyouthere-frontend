"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_URL, api, ApiError, type AdminMediaItem, type AdminMediaListResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function MediaGrid({
  initialMedia,
  initialCursor,
  basePath,
}: {
  initialMedia: AdminMediaItem[];
  initialCursor: string | null;
  basePath: string;
}) {
  const [media, setMedia] = useState(initialMedia);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setPending("more");
    setError(null);
    try {
      const sep = basePath.includes("?") ? "&" : "?";
      const res = await api<AdminMediaListResponse>(`${basePath}${sep}cursor=${encodeURIComponent(cursor)}`);
      setMedia((prev) => [...prev, ...res.media]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function reject(id: string) {
    setPending(id);
    setError(null);
    try {
      await api(`/v1/admin/media/${id}/reject`, { method: "POST" });
      setMedia((prev) => prev.map((m) => (m.id === id ? { ...m, moderation_status: "rejected" } : m)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {media.map((m) => (
          <figure key={m.id} className="flex flex-col gap-1.5 rounded-xl bg-card p-2 ring-1 ring-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only moderation view served from the API host, not eligible for next/image */}
            <img
              src={`${API_URL}/v1/admin/media/${m.id}/file?w=480`}
              alt={`Upload by ${m.guest_name ?? "a guest"}`}
              className="aspect-square w-full rounded-lg object-cover"
              width={480}
              height={480}
            />
            <figcaption className="flex flex-col gap-1 text-sm text-muted-foreground">
              <Link href={`/admin/events/${m.event.id}`} className="truncate hover:underline">
                {m.event.title || "(untitled)"}
              </Link>
              <span>{m.guest_name ?? "Host upload"} · {formatDateTime(m.created_at)}</span>
              <Badge variant={m.moderation_status === "rejected" ? "destructive" : m.moderation_status === "approved" ? "default" : "secondary"} className="w-fit capitalize">
                {m.moderation_status}
              </Badge>
            </figcaption>
            {m.moderation_status !== "rejected" && (
              <Button
                variant="destructive"
                size="sm"
                disabled={pending !== null}
                onClick={() => reject(m.id)}
              >
                {pending === m.id ? "Rejecting…" : "Reject"}
              </Button>
            )}
          </figure>
        ))}
      </div>
      {cursor && (
        <Button variant="outline" className="self-start" disabled={pending !== null} onClick={loadMore}>
          {pending === "more" ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
