"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminErrorMessage } from "@/lib/admin-confirm";
import { api, ApiError, type AdminUserUpdateResponse } from "@/lib/api";

export function EditUserForm({
  userId,
  name,
  email,
  canEditEmail,
  emailLockedReason = null,
}: {
  userId: string;
  name: string;
  email: string;
  canEditEmail: boolean;
  emailLockedReason?: string | null;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState({ name, email });
  const [nameValue, setNameValue] = useState(name);
  const [emailValue, setEmailValue] = useState(email);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const nameChanged = nameValue.trim() !== saved.name;
  const emailChanged = canEditEmail && emailValue.trim().toLowerCase() !== saved.email.toLowerCase();
  const dirty = nameChanged || emailChanged;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending || !dirty) return;
    setPending(true);
    setError(null);
    setNotice(null);
    const body: { name?: string; email?: string } = {};
    if (nameChanged) body.name = nameValue.trim();
    if (emailChanged) body.email = emailValue.trim();
    try {
      const { user } = await api<AdminUserUpdateResponse>(`/v1/admin/users/${userId}`, {
        method: "PATCH",
        json: body,
      });
      setSaved({ name: user.name, email: user.email });
      setNameValue(user.name);
      setEmailValue(user.email);
      setNotice(
        emailChanged
          ? "Saved. They've been signed out everywhere, and we've emailed their old address."
          : "Saved.",
      );
      router.refresh();
    } catch (err) {
      setError(adminErrorMessage(err instanceof ApiError ? err : null));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit-user-name">Name</Label>
        <Input
          id="edit-user-name"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          maxLength={100}
          autoComplete="off"
          disabled={pending}
        />
      </div>
      {canEditEmail && (
        <div className="grid gap-2">
          <Label htmlFor="edit-user-email">Email</Label>
          <Input
            id="edit-user-email"
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            maxLength={254}
            required
            autoComplete="off"
            disabled={pending}
            aria-describedby="edit-user-email-hint"
          />
          <p id="edit-user-email-hint" className="text-sm text-muted-foreground">
            Changing the email signs them out everywhere and sends a heads-up to their old address.
          </p>
        </div>
      )}
      {emailLockedReason && (
        <p className="text-sm text-muted-foreground">{emailLockedReason}</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
