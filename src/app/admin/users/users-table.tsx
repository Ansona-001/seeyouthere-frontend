"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError, type AdminUserSummary, type AdminUsersListResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function UsersTable({
  initialUsers,
  initialCursor,
  basePath,
}: {
  initialUsers: AdminUserSummary[];
  initialCursor: string | null;
  basePath: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!cursor) return;
    setPending(true);
    setError(null);
    try {
      const sep = basePath.includes("?") ? "&" : "?";
      const res = await api<AdminUsersListResponse>(`${basePath}${sep}cursor=${encodeURIComponent(cursor)}`);
      setUsers((prev) => [...prev, ...res.users]);
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
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                  {u.name || "(no name)"}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant={u.status === "active" ? "secondary" : "destructive"}>{u.status}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{u.roles.join(", ") || "—"}</TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
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
