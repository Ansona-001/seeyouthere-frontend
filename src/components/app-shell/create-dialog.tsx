"use client";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { HOST_OPTION, INVITE_OPTIONS, type CreateOption } from "./create-options";
import { OccasionTile } from "./occasion-art";

function Option({ option, onPick }: { option: CreateOption; onPick: () => void }) {
  return (
    <li>
      <Link
        href={option.href}
        onClick={onPick}
        className="group flex flex-col items-center gap-2 rounded-2xl p-1 text-center text-sm font-medium text-brand-heading outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <OccasionTile
          slug={option.slug}
          site={option.site}
          className="aspect-square w-full max-w-24 rounded-2xl shadow-sm ring-1 ring-foreground/10 transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none"
        />
        <span className="leading-tight">{option.label}</span>
      </Link>
    </li>
  );
}

/**
 * The "Create" popup: pick an invitation occasion, or host an event. It replaces a trip to the /create page for
 * signed-in users. Picking an option navigates and closes it (the app shell stays mounted across navigation, so it
 * would otherwise stay open on the next page).
 */
export function CreateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const close = () => onOpenChange(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-brand-heading">What do you want to create?</DialogTitle>
          <DialogDescription>Invitations and event websites work differently, so they start separately.</DialogDescription>
        </DialogHeader>

        <section aria-labelledby="create-invites" className="grid gap-3">
          <h3 id="create-invites" className="text-sm font-semibold">
            Invite
            <span className="ml-2 font-normal text-muted-foreground">for a celebration, with RSVPs</span>
          </h3>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
            {INVITE_OPTIONS.map((o) => (
              <Option key={o.label} option={o} onPick={close} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="create-event" className="grid gap-3 border-t pt-4">
          <h3 id="create-event" className="text-sm font-semibold">
            Event website
            <span className="ml-2 font-normal text-muted-foreground">a programme, registration and check-in</span>
          </h3>
          <ul className="grid grid-cols-3 gap-x-3 sm:grid-cols-4">
            <Option option={HOST_OPTION} onPick={close} />
          </ul>
        </section>
      </DialogContent>
    </Dialog>
  );
}
