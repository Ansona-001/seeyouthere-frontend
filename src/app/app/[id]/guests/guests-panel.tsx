"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, ApiError, type EventRole, type Guest, type GuestsListResponse } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

import { GuestFormDialog } from "./guest-form-dialog";

type ImportResult = { imported: number; skipped_existing: number };

function whatsappLink(phone: string, inviteUrl: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(inviteUrl)}`;
}

export function GuestsPanel({
  eventId,
  role,
  published,
  initialGuests,
  initialCursor,
  initialQuery,
  basePath,
}: {
  eventId: string;
  role: EventRole;
  published: boolean;
  initialGuests: Guest[];
  initialCursor: string | null;
  initialQuery: string;
  basePath: string;
}) {
  const router = useRouter();
  const canManage = role === "owner" || role === "editor";
  const [guests, setGuests] = useState(initialGuests);
  const [cursor, setCursor] = useState(initialCursor);
  const [query, setQuery] = useState(initialQuery);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function search(e: FormEvent) {
    e.preventDefault();
    router.push(`/app/${eventId}/guests${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  async function loadMore() {
    if (!cursor) return;
    setPending("more");
    setError(null);
    try {
      const sep = basePath.includes("?") ? "&" : "?";
      const res = await api<GuestsListResponse>(`${basePath}${sep}cursor=${encodeURIComponent(cursor)}`);
      setGuests((prev) => [...prev, ...res.guests]);
      setCursor(res.next_cursor);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this guest? Their RSVP will be removed too.")) return;
    setPending(id);
    setError(null);
    try {
      await api(`/v1/events/${eventId}/guests/${id}`, { method: "DELETE" });
      setGuests((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function rotateLink(id: string) {
    setPending(id);
    setError(null);
    try {
      const { guest } = await api<{ guest: Guest }>(`/v1/events/${eventId}/guests/${id}/rotate-link`, { method: "POST" });
      setGuests((prev) => prev.map((g) => (g.id === id ? guest : g)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Invite link copied.");
      setTimeout(() => setNotice(null), 2000);
    } catch {
      // Ignored — the link is still shown as plain text.
    }
  }

  async function sendInvites(guestIds: string[] | null) {
    setPending(guestIds ? guestIds[0] : "send-all");
    setError(null);
    setNotice(null);
    try {
      const body = guestIds ? { guest_ids: guestIds } : { all_uninvited: true };
      const { queued } = await api<{ queued: number }>(`/v1/events/${eventId}/guests/send-invites`, {
        method: "POST",
        json: body,
      });
      setNotice(queued > 0 ? `Queued ${queued} invite${queued === 1 ? "" : "s"}.` : "No new invites to send.");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "event_not_published") {
        setError("Publish this event before sending invites.");
      } else if (err instanceof ApiError && err.code === "daily_limit") {
        setError("You've reached today's invite-sending limit. Try again tomorrow.");
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      }
    } finally {
      setPending(null);
    }
  }

  async function importCsv(e: FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setPending("import");
    setError(null);
    setNotice(null);
    try {
      const result = await api<ImportResult>(`/v1/events/${eventId}/guests/import`, {
        method: "POST",
        body: file,
        headers: { "Content-Type": "text/csv" },
      });
      setNotice(`Imported ${result.imported} guest${result.imported === 1 ? "" : "s"} (${result.skipped_existing} already on the list).`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "invalid_csv") {
        setError(`That file couldn't be imported: ${err.message}`);
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      }
    } finally {
      setPending(null);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={search} className="flex gap-2">
          <Input
            aria-label="Search guests"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56"
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        {canManage && (
          <div className="flex flex-wrap gap-2">
            <GuestFormDialog
              eventId={eventId}
              trigger={<Button>Add guest</Button>}
              onSaved={(g) => setGuests((prev) => [g, ...prev])}
            />
            <form onSubmit={importCsv} className="flex items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="text/csv,.csv"
                aria-label="Import guests from CSV"
                className="text-sm"
              />
              <Button type="submit" variant="outline" disabled={pending === "import"}>
                {pending === "import" ? "Importing…" : "Import CSV"}
              </Button>
            </form>
            <Button type="button" variant="outline" disabled={pending !== null} onClick={() => sendInvites(null)}>
              {pending === "send-all" ? "Sending…" : "Send to all uninvited"}
            </Button>
          </div>
        )}
      </div>

      {!published && canManage && (
        <p className="text-sm text-muted-foreground">Publish this event to send invites.</p>
      )}
      {notice && <p className="text-sm text-green-700 dark:text-green-500">{notice}</p>}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {guests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No guests yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Household</TableHead>
              <TableHead>RSVP</TableHead>
              <TableHead>Invited</TableHead>
              {canManage && <TableHead className="text-right">&nbsp;</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {guests.map((g) => (
              <GuestRow
                key={g.id}
                guest={g}
                eventId={eventId}
                canManage={canManage}
                pending={pending}
                onRemove={remove}
                onRotate={rotateLink}
                onCopy={copyLink}
                onSendInvite={(id) => sendInvites([id])}
                onSaved={(saved) => setGuests((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))}
              />
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

function GuestRow({
  guest: g,
  eventId,
  canManage,
  pending,
  onRemove,
  onRotate,
  onCopy,
  onSendInvite,
  onSaved,
}: {
  guest: Guest;
  eventId: string;
  canManage: boolean;
  pending: string | null;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onCopy: (url: string) => void;
  onSendInvite: (id: string) => void;
  onSaved: (guest: Guest) => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{g.name}</TableCell>
      <TableCell className="text-muted-foreground">
        <div className="flex flex-col">
          <span>{g.email ?? "—"}</span>
          {g.phone && <span>{g.phone}</span>}
        </div>
      </TableCell>
      <TableCell>{g.household_size}</TableCell>
      <TableCell>
        {g.rsvp ? (
          <Badge variant={g.rsvp.attending === "yes" ? "secondary" : "outline"}>
            {g.rsvp.attending} ({g.rsvp.count})
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">No response</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDateTime(g.invited_at)}</TableCell>
      {canManage && (
        <TableCell className="flex flex-wrap justify-end gap-1.5 text-right">
          {g.invite_url && (
            <>
              <Button variant="outline" size="sm" onClick={() => onCopy(g.invite_url!)}>
                Copy link
              </Button>
              {g.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  render={<a href={whatsappLink(g.phone, g.invite_url)} target="_blank" rel="noopener noreferrer" />}
                >
                  WhatsApp
                </Button>
              )}
              <Button variant="outline" size="sm" disabled={pending === g.id} onClick={() => onRotate(g.id)}>
                {pending === g.id ? "Rotating…" : "Rotate link"}
              </Button>
            </>
          )}
          {g.email && !g.invited_at && (
            <Button variant="outline" size="sm" disabled={pending === g.id} onClick={() => onSendInvite(g.id)}>
              {pending === g.id ? "Sending…" : "Send invite"}
            </Button>
          )}
          <GuestFormDialog
            eventId={eventId}
            guest={g}
            trigger={
              <Button variant="outline" size="sm">
                Edit
              </Button>
            }
            onSaved={onSaved}
          />
          <Button variant="destructive" size="sm" disabled={pending === g.id} onClick={() => onRemove(g.id)}>
            Remove
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}
