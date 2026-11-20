"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, type EventKind, type EventsListResponse, type EventStatus, type EventSummary } from "@/lib/api";
import { STATUS_LABEL } from "@/lib/event-status";
import { formatDateTime } from "@/lib/format";

import { ItemActions } from "./item-actions";

const STATUS_VARIANT: Record<EventStatus, "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  published: "secondary",
  hidden: "outline",
  taken_down: "destructive",
};

export function EventsList({
  initialEvents,
  initialCursor,
  kind,
}: {
  initialEvents: EventSummary[];
  initialCursor: string | null;
  /** Which list this is; the "Load more" request is filtered to the same kind. Omitted = both kinds. */
  kind?: EventKind;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setPending(true);
    setError(null);
    try {
      const res = await api<EventsListResponse>(`/v1/events?limit=25${kind ? `&kind=${kind}` : ""}&cursor=${encodeURIComponent(cursor)}`);
      setEvents((prev) => [...prev, ...res.events]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {events.map((e) => (
          <li key={e.id}>
            <Card className="relative transition-shadow focus-within:ring-2 focus-within:ring-ring [@media(hover:hover)]:hover:shadow-md">
              <Link href={`/app/${e.id}`} className="contents outline-none">
                <CardHeader className="pr-24">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-2xl">
                    {e.title || "(untitled)"}
                    <Badge variant={STATUS_VARIANT[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                    {e.role !== "owner" && <Badge variant="outline">Co-host · {e.role}</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{e.starts_at ? formatDateTime(e.starts_at) : "No date set"}</span>
                  {e.status === "published" && (
                    <span>
                      {e.rsvp.yes} yes ({e.rsvp.yes_heads} {e.rsvp.yes_heads === 1 ? "guest" : "guests"}) · {e.rsvp.maybe} maybe · {e.rsvp.no} no
                    </span>
                  )}
                </CardContent>
              </Link>
              <ItemActions
                id={e.id}
                title={e.title}
                kind={e.kind}
                role={e.role}
                onDeleted={() => setEvents((prev) => prev.filter((x) => x.id !== e.id))}
                className="absolute top-3 right-3"
              />
            </Card>
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {cursor && (
        <Button variant="outline" className="self-start" disabled={pending} onClick={loadMore}>
          {pending ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
