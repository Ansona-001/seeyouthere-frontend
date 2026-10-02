"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_URL, api, ApiError, type EventRole, type Media, type MediaListResponse, type ModerationStatus } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const STATUSES: { value: ModerationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/** Guest photo moderation grid (§4.8, §11.1): approve/reject pending uploads. */
export function PhotosPanel({
  eventId,
  role,
  status,
  initialMedia,
  initialCursor,
  basePath,
}: {
  eventId: string;
  role: EventRole;
  status: ModerationStatus;
  initialMedia: Media[];
  initialCursor: string | null;
  basePath: string;
}) {
  const canModerate = role === "owner" || role === "editor";
  const [media, setMedia] = useState(initialMedia);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setPending("more");
    setError(null);
    try {
      const res = await api<MediaListResponse>(`${basePath}&cursor=${encodeURIComponent(cursor)}`);
      setMedia((prev) => [...prev, ...res.media]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function moderate(id: string, action: "approve" | "reject") {
    setPending(id);
    setError(null);
    try {
      await api(`/v1/events/${eventId}/media/${id}/${action}`, { method: "POST" });
      setMedia((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filter by moderation status" className="flex gap-1">
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={`/app/${eventId}/photos?status=${s.value}`}
            aria-current={status === s.value ? "page" : undefined}
            className={
              status === s.value
                ? "rounded-lg bg-primary px-2.5 py-1 text-sm font-medium text-primary-foreground"
                : "rounded-lg px-2.5 py-1 text-sm font-medium text-muted-foreground hover:bg-muted"
            }
          >
            {s.label}
          </Link>
        ))}
      </nav>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {status} photos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.map((m) => (
            <figure key={m.id} className="flex flex-col gap-1.5 rounded-xl bg-card p-2 ring-1 ring-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element -- host moderation view served from the API host, not eligible for next/image */}
              <img
                src={`${API_URL}/v1/events/${eventId}/media/${m.id}/file?w=480`}
                alt={`Upload by ${m.guest_name ?? "a guest"}`}
                className="aspect-square w-full rounded-lg object-cover"
                width={480}
                height={480}
              />
              <figcaption className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>{m.guest_name ?? "Guest"} · {formatDateTime(m.created_at)}</span>
                <Badge variant={m.moderation_status === "rejected" ? "destructive" : "secondary"} className="w-fit">
                  {m.moderation_status}
                </Badge>
              </figcaption>
              {canModerate && m.moderation_status === "pending" && (
                <div className="flex gap-1.5">
                  <Button size="sm" disabled={pending !== null} onClick={() => moderate(m.id, "approve")} className="flex-1">
                    {pending === m.id ? "…" : "Approve"}
                  </Button>
                  <Button variant="destructive" size="sm" disabled={pending !== null} onClick={() => moderate(m.id, "reject")} className="flex-1">
                    Reject
                  </Button>
                </div>
              )}
            </figure>
          ))}
        </div>
      )}
      {cursor && (
        <Button variant="outline" size="sm" className="self-start" disabled={pending !== null} onClick={loadMore}>
          {pending === "more" ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
