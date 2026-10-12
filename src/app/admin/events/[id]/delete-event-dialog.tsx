"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminErrorMessage, eventConfirmMatches, eventConfirmTarget } from "@/lib/admin-confirm";
import { api, ApiError } from "@/lib/api";

export function DeleteEventDialog({
  eventId,
  slug,
}: {
  eventId: string;
  slug: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = eventConfirmTarget(slug);
  const matches = eventConfirmMatches(confirm, slug);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending || !matches) return;
    setPending(true);
    setError(null);
    try {
      const body: { confirm: string; reason?: string } = { confirm };
      if (reason.trim()) body.reason = reason.trim();
      await api(`/v1/admin/events/${eventId}`, { method: "DELETE", json: body });
      router.replace("/admin/events");
      router.refresh();
    } catch (err) {
      setError(adminErrorMessage(err instanceof ApiError ? err : null));
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return; // no Escape, backdrop or close while deleting
        setOpen(next);
        if (!next) {
          setConfirm("");
          setReason("");
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant="destructive" />}>Delete event…</DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Delete this event permanently?</DialogTitle>
            <DialogDescription>
              This deletes the event with all its guests, RSVPs and photos. This can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="delete-event-confirm">
              {slug ? "To confirm, type the event address " : "To confirm, type "}
              <span className="font-mono font-semibold text-foreground">{target}</span>
            </Label>
            <Input
              id="delete-event-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              disabled={pending}
              aria-invalid={confirm !== "" && !matches ? true : undefined}
              placeholder={target}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="delete-event-reason">Reason (optional, kept in the audit log)</Label>
            <Input
              id="delete-event-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              autoComplete="off"
              disabled={pending}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending || !matches}>
              {pending ? "Deleting…" : "Permanently delete event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
