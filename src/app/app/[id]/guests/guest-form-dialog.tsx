"use client";

import { useState, type FormEvent, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type Guest } from "@/lib/api";

/** Add/edit dialog for one guest (§4.6). Shared by the "Add guest" trigger and each row's "Edit" button. */
export function GuestFormDialog({
  eventId,
  guest,
  trigger,
  onSaved,
}: {
  eventId: string;
  guest?: Guest;
  trigger: ReactElement;
  onSaved: (guest: Guest) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(guest?.name ?? "");
  const [email, setEmail] = useState(guest?.email ?? "");
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [householdSize, setHouseholdSize] = useState(String(guest?.household_size ?? 1));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(guest?.name ?? "");
    setEmail(guest?.email ?? "");
    setPhone(guest?.phone ?? "");
    setHouseholdSize(String(guest?.household_size ?? 1));
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const body = {
        name,
        email: email.trim() || null,
        phone: phone.trim() || null,
        household_size: Number(householdSize),
      };
      const { guest: saved } = guest
        ? await api<{ guest: Guest }>(`/v1/events/${eventId}/guests/${guest.id}`, { method: "PATCH", json: body })
        : await api<{ guest: Guest }>(`/v1/events/${eventId}/guests`, { method: "POST", json: body });
      onSaved(saved);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{guest ? "Edit guest" : "Add guest"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-name">Name</Label>
            <Input id="guest-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-email">Email</Label>
            <Input id="guest-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-phone">Phone</Label>
            <Input id="guest-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="guest-household">Household size</Label>
            <Input
              id="guest-household"
              type="number"
              min={1}
              max={50}
              value={householdSize}
              onChange={(e) => setHouseholdSize(e.target.value)}
              required
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
