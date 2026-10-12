"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError, type AdminAuditEntry, type AdminAuditListResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function AuditList({
  initialEntries,
  initialCursor,
}: {
  initialEntries: AdminAuditEntry[];
  initialCursor: string | null;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setPending(true);
    setError(null);
    try {
      const res = await api<AdminAuditListResponse>(`/v1/admin/audit?cursor=${encodeURIComponent(cursor)}`);
      setEntries((prev) => [...prev, ...res.entries]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-muted-foreground">{formatDateTime(e.created_at)}</TableCell>
              <TableCell>{e.actor_email ?? "system"}</TableCell>
              <TableCell className="font-mono text-sm">{e.action}</TableCell>
              <TableCell className="text-muted-foreground">
                {e.target_type} {e.target_id.slice(0, 8)}…
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {cursor && (
        <Button variant="outline" className="self-start" disabled={pending} onClick={loadMore}>
          {pending ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
