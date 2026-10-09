"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError, type EventRole, type Member, type MemberRole } from "@/lib/api";

/** Co-hosts (§4.7, §11.1): owner-only add/role-change/remove; anyone can leave their own membership. */
export function TeamPanel({
  eventId,
  viewerRole,
  viewerUserId,
  initialMembers,
}: {
  eventId: string;
  viewerRole: EventRole;
  viewerUserId: string | null;
  initialMembers: Member[];
}) {
  const router = useRouter();
  const isOwner = viewerRole === "owner";
  const [members, setMembers] = useState(initialMembers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setPending("add");
    setError(null);
    setNotice(null);
    try {
      await api(`/v1/events/${eventId}/members`, { method: "POST", json: { email: email.trim(), role } });
      setNotice(`Invited ${email.trim()}.`);
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function changeRole(userId: string, newRole: MemberRole) {
    setPending(userId);
    setError(null);
    try {
      await api(`/v1/events/${eventId}/members/${userId}`, { method: "PATCH", json: { role: newRole } });
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function remove(userId: string, isSelf: boolean) {
    if (!confirm(isSelf ? "Leave this event?" : "Remove this co-host?")) return;
    setPending(userId);
    setError(null);
    try {
      await api(`/v1/events/${eventId}/members/${userId}`, { method: "DELETE" });
      if (isSelf) {
        router.push("/app");
        return;
      }
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {isOwner && (
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <div className="grid w-full gap-1.5 sm:w-auto">
            <Label htmlFor="member-email">Email</Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
              className="w-full sm:w-64"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="member-role">Role</Label>
            <Select value={role} onValueChange={(v) => v && setRole(v as MemberRole)}>
              <SelectTrigger id="member-role" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending !== null}>
            {pending === "add" ? "Adding…" : "Add co-host"}
          </Button>
        </form>
      )}

      {notice && <p role="status" className="text-sm font-medium text-brand-success">{notice}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">&nbsp;</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const isSelf = m.user_id === viewerUserId;
            return (
              <TableRow key={m.user_id}>
                <TableCell className="font-medium">
                  {m.name || "(no name)"} {isSelf && <span className="text-muted-foreground">(you)</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{m.email}</TableCell>
                <TableCell>
                  {isOwner && m.role !== "owner" ? (
                    <Select value={m.role} onValueChange={(v) => v && changeRole(m.user_id, v as MemberRole)}>
                      <SelectTrigger className="w-28" disabled={pending === m.user_id}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize">{m.role}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {m.role !== "owner" && (isOwner || isSelf) && (
                    <Button
                      variant={isSelf ? "outline" : "destructive"}
                      size="sm"
                      disabled={pending === m.user_id}
                      onClick={() => remove(m.user_id, isSelf)}
                    >
                      {pending === m.user_id ? "…" : isSelf ? "Leave" : "Remove"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
