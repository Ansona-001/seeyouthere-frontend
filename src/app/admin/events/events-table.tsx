"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError, type AdminEventSummary, type AdminEventsListResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function EventsTable({
  initialEvents,
  initialCursor,
  basePath,
}: {
  initialEvents: AdminEventSummary[];
  initialCursor: string | null;
  basePath: string;
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
      const sep = basePath.includes("?") ? "&" : "?";
      const res = await api<AdminEventsListResponse>(`${basePath}${sep}cursor=${encodeURIComponent(cursor)}`);
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => (
            <TableRow key={e.id}>
              <TableCell>
                <Link href={`/admin/events/${e.id}`} className="font-medium hover:underline">
                  {e.title || "(untitled)"}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{e.owner_email}</TableCell>
              <TableCell>
                <Badge variant={e.status === "taken_down" ? "destructive" : "secondary"}>{e.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(e.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {cursor && (
        <Button variant="outline" size="sm" className="self-start" disabled={pending} onClick={loadMore}>
          {pending ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
