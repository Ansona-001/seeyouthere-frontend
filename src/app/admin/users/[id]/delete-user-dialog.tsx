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
import { adminErrorMessage, emailConfirmMatches } from "@/lib/admin-confirm";
import { api, ApiError, type AdminUserDeleteResponse } from "@/lib/api";

export function DeleteUserDialog({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = emailConfirmMatches(confirmEmail, email);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending || !matches) return;
    setPending(true);
    setError(null);
    try {
      const body: { confirm_email: string; reason?: string } = { confirm_email: confirmEmail };
      if (reason.trim()) body.reason = reason.trim();
      await api<AdminUserDeleteResponse>(`/v1/admin/users/${userId}`, { method: "DELETE", json: body });
      router.replace("/admin/users");
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
          setConfirmEmail("");
          setReason("");
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button variant="destructive" />}>Delete this user…</DialogTrigger>
      <DialogContent showCloseButton={!pending}>
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Delete this user permanently?</DialogTitle>
            <DialogDescription>
              This deletes the account and the events they own, with all guests, RSVPs and photos. This
              can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="delete-user-confirm">
              To confirm, type their email below
            </Label>
            <Input
              id="delete-user-confirm"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              disabled={pending}
              aria-invalid={confirmEmail !== "" && !matches ? true : undefined}
              placeholder={email}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="delete-user-reason">Reason (optional)</Label>
            <Input
              id="delete-user-reason"
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
              {pending ? "Deleting…" : "Permanently delete user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
