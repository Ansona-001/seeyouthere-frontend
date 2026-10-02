"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiError, type AdminReport, type AdminReportsListResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function ReportsList({
  initialReports,
  initialCursor,
  basePath,
}: {
  initialReports: AdminReport[];
  initialCursor: string | null;
  basePath: string;
}) {
  const [reports, setReports] = useState(initialReports);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setPending("more");
    setError(null);
    try {
      const sep = basePath.includes("?") ? "&" : "?";
      const res = await api<AdminReportsListResponse>(`${basePath}${sep}cursor=${encodeURIComponent(cursor)}`);
      setReports((prev) => [...prev, ...res.reports]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function dismiss(id: string) {
    setPending(id);
    setError(null);
    try {
      await api(`/v1/admin/reports/${id}/dismiss`, { method: "POST" });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {reports.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Link href={`/admin/events/${r.event.id}`} className="hover:underline">
                {r.event.title || "(untitled event)"}
              </Link>
              <Badge variant="outline">{r.event.status}</Badge>
              {r.open_reports_for_event > 1 && <Badge variant="destructive">{r.open_reports_for_event} reports</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm">
              <span className="font-medium">{r.reason}</span>
              {r.details ? `: ${r.details}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Owner: {r.event.owner_email} · reported {formatDateTime(r.created_at)}
            </p>
            {r.status === "open" || r.status === "reviewing" ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pending !== null} onClick={() => dismiss(r.id)}>
                  {pending === r.id ? "Dismissing…" : "Dismiss"}
                </Button>
                <Button variant="destructive" size="sm" render={<Link href={`/admin/events/${r.event.id}`} />}>
                  Review event
                </Button>
              </div>
            ) : (
              <Badge variant="secondary">{r.status}</Badge>
            )}
          </CardContent>
        </Card>
      ))}
      {cursor && (
        <Button variant="outline" size="sm" className="self-start" disabled={pending !== null} onClick={loadMore}>
          {pending === "more" ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
