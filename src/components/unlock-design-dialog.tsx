"use client";

import { useId, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError, type Event, type PaymentRequiredDetails, type Region, type RegionPrice } from "@/lib/api";
import { formatMoney, initialRegion, REGION_LABELS, rememberRegion, whatsappUrl } from "@/lib/premium";
import { cn } from "cn";

/** The 402 `payment_required` details of an API error, or null for any other error. */
export function paymentRequiredDetails(err: unknown): PaymentRequiredDetails | null {
  if (!(err instanceof ApiError) || err.status !== 402 || err.code !== "payment_required") return null;
  const d = err.details as Partial<PaymentRequiredDetails> | undefined;
  if (!d || typeof d.template_id !== "string" || !Array.isArray(d.prices) || d.prices.length === 0) return null;
  return { template_id: d.template_id, prices: d.prices };
}

/**
 * Shown when publishing (or switching a published event) needs a premium design unlock. Payment is
 * manual: the owner chats on WhatsApp and an admin marks the event paid. "Check again" first reads
 * the event (cheap, so it never burns the publish rate limit) and re-runs the blocked action via
 * `onCheck` only once the event reports its current design as paid. `onCheck` resolves true once the
 * action no longer needs payment, which closes the dialog.
 */
export function UnlockDesignDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  templateName,
  templateId,
  prices,
  isOwner,
  switching = false,
  onCheck,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  templateName: string;
  /** The template the blocked action needs unlocked. */
  templateId: string;
  /** Offered regional prices (IN always present). */
  prices: RegionPrice[];
  /** Only the owner can pay; editors are told to ask them. */
  isOwner: boolean;
  /** Switching a live event to a different premium design: it can't be unlocked until the event is unpublished. */
  switching?: boolean;
  onCheck: () => Promise<boolean>;
}) {
  const [checking, setChecking] = useState(false);
  const [stillLocked, setStillLocked] = useState(false);

  const [region, setRegion] = useState<Region | null>(() => initialRegion(prices));
  const groupName = useId();

  const selected = prices.find((p) => p.region === region) ?? prices[0];
  const price = selected ? formatMoney(selected.currency, selected.amount_minor) : "";
  const href = selected
    ? whatsappUrl(
        process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
        `Hi! I'd like to unlock the "${templateName}" design for my event "${eventTitle || "Untitled event"}" (event ID: ${eventId}). Region: ${REGION_LABELS[selected.region]}, price: ${selected.currency} ${price}.`,
      )
    : null;

  async function check() {
    setChecking(true);
    setStillLocked(false);
    try {
      // Read the event first: only retry the blocked action (publish, switch...) once it is really paid.
      const { event } = await api<{ event: Event }>(`/v1/events/${eventId}`);
      if (event.template.id === templateId && event.premium?.paid === true && (await onCheck())) {
        onOpenChange(false);
      } else {
        setStillLocked(true);
      }
    } catch {
      setStillLocked(true);
    } finally {
      setChecking(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) setStillLocked(false);
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock this design</DialogTitle>
          <DialogDescription>
            This design is premium. Unlock it for this event for {price} (one-time).
          </DialogDescription>
        </DialogHeader>

        {switching && (
          <p className="text-sm">
            To use this premium design on a live invitation, unpublish it first, choose the design, then unlock and
            publish.
          </p>
        )}

        {!switching && isOwner && prices.length > 1 && (
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Your region</legend>
            <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl bg-muted p-1">
              {prices.map((p) => (
                <label
                  key={p.region}
                  className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-2 text-center text-sm has-checked:bg-background has-checked:font-medium has-checked:shadow-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={p.region}
                    checked={selected?.region === p.region}
                    onChange={() => {
                      setRegion(p.region);
                      rememberRegion(p.region);
                    }}
                    className="sr-only"
                  />
                  {REGION_LABELS[p.region]}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {switching ? null : isOwner ? (
          <div className="flex flex-col gap-3 text-sm">
            <p>Chat with us on WhatsApp to pay; we will unlock your event, usually within a day.</p>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants(), "min-h-11 w-full sm:w-fit")}
              >
                Chat on WhatsApp
              </a>
            ) : (
              <p className="font-medium">Contact support to unlock</p>
            )}
            {stillLocked && (
              <p role="status" className="rounded-xl bg-muted px-3 py-2 text-muted-foreground">
                Not unlocked yet. Once we have marked your event as paid, check again.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm">Ask the event owner to unlock this design, then try again.</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          {!switching && (
            <Button type="button" onClick={check} disabled={checking}>
              {checking ? "Checking…" : isOwner ? "I've paid — check again" : "Check again"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
