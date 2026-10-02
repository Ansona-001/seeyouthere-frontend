"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  API_URL,
  api,
  ApiError,
  type AttendingStatus,
  type EventRole,
  type Rsvp,
  type RsvpsListResponse,
  type RsvpSummary,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const FILTERS: { value: AttendingStatus | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "yes", label: "Yes" },
  { value: "maybe", label: "Maybe" },
  { value: "no", label: "No" },
];

export function RsvpsPanel({
  eventId,
  role,
  initialRsvps,
  initialCursor,
  summary,
  attending,
  basePath,
}: {
  eventId: string;
  role: EventRole;
  initialRsvps: Rsvp[];
  initialCursor: string | null;
  summary: RsvpSummary | null;
  attending: AttendingStatus | null;
  basePath: string;
}) {
  const [rsvps, setRsvps] = useState(initialRsvps);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManage = role === "owner" || role === "editor";

  async function loadMore() {
    if (!cursor) return;
    setPending("more");
    setError(null);
    try {
      const sep = basePath.includes("?") ? "&" : "?";
      const res = await api<RsvpsListResponse>(`${basePath}${sep}cursor=${encodeURIComponent(cursor)}`);
      setRsvps((prev) => [...prev, ...res.rsvps]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this RSVP? This can't be undone.")) return;
    setPending(id);
    setError(null);
    try {
      await api(`/v1/events/${eventId}/rsvps/${id}`, { method: "DELETE" });
      setRsvps((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile label="Yes" value={`${summary.yes} (${summary.yes_heads} guests)`} />
          <SummaryTile label="Maybe" value={`${summary.maybe} (${summary.maybe_heads} guests)`} />
          <SummaryTile label="No" value={summary.no} />
          <SummaryTile label="Responded" value={`${summary.guests_responded} / ${summary.guests_total}`} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by response" className="flex gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f.label}
              href={f.value ? `/app/${eventId}/rsvps?attending=${f.value}` : `/app/${eventId}/rsvps`}
              aria-current={attending === f.value ? "page" : undefined}
              className={
                attending === f.value
                  ? "rounded-lg bg-primary px-2.5 py-1 text-sm font-medium text-primary-foreground"
                  : "rounded-lg px-2.5 py-1 text-sm font-medium text-muted-foreground hover:bg-muted"
              }
            >
              {f.label}
            </Link>
          ))}
        </nav>
        <a
          href={`${API_URL}/v1/events/${eventId}/rsvps.csv`}
          className="rounded-lg border border-input px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Download CSV
        </a>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {rsvps.length === 0 ? (
        <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Count</TableHead>
              <TableHead>Updated</TableHead>
              {canManage && <TableHead className="text-right">&nbsp;</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rsvps.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={r.attending === "yes" ? "secondary" : r.attending === "no" ? "outline" : "default"}>
                    {r.attending}
                  </Badge>
                </TableCell>
                <TableCell>{r.count}</TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(r.updated_at)}</TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => remove(r.id)}>
                      {pending === r.id ? "Removing…" : "Remove"}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {cursor && (
        <Button variant="outline" size="sm" className="self-start" disabled={pending !== null} onClick={loadMore}>
          {pending === "more" ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
