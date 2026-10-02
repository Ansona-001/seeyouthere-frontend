"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError, type Session } from "@/lib/api";
import { formatRelative } from "@/lib/format";

export function SessionsList({ initialSessions }: { initialSessions: Session[] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const others = sessions.filter((s) => !s.current);

  async function revoke(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/v1/me/sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function revokeOthers() {
    setRevokingOthers(true);
    setError(null);
    try {
      await api("/v1/me/sessions/revoke-others", { method: "POST" });
      setSessions((prev) => prev.filter((s) => s.current));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setRevokingOthers(false);
    }
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No active sessions.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Device</TableHead>
            <TableHead>Last seen</TableHead>
            <TableHead className="text-right">&nbsp;</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="max-w-56 truncate whitespace-normal">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate">{s.user_agent || "Unknown device"}</span>
                  {s.current && <Badge variant="secondary">This device</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{s.ip}</div>
              </TableCell>
              <TableCell>{formatRelative(s.last_seen_at)}</TableCell>
              <TableCell className="text-right">
                {!s.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === s.id}
                    onClick={() => revoke(s.id)}
                  >
                    {busyId === s.id ? "Revoking…" : "Revoke"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {others.length > 0 && (
        <div>
          <Button variant="outline" size="sm" disabled={revokingOthers} onClick={revokeOthers}>
            {revokingOthers ? "Signing out other devices…" : "Sign out all other devices"}
          </Button>
        </div>
      )}
    </div>
  );
}
