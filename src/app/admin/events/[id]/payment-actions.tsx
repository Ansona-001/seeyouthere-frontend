"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type AdminEventPayment, type EventPremium, type Region } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { formatMoney, REGION_LABELS } from "@/lib/premium";

function conflictMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return "Couldn't reach the server. Please try again.";
  if (err.code === "template_changed") return "The event's design changed since this page loaded — reload and check.";
  if (err.code === "price_changed") return "The price changed since this page loaded — reload and check the amount.";
  if (err.code === "region_unavailable") return "That region isn't offered for this design any more. Reload and pick again.";
  if (err.code === "already_paid") return "This design is already paid for. Reload to see the latest state.";
  if (err.status === 409) return "Already paid, or this design isn't premium. Refresh to see the latest state.";
  return err.message;
}

/**
 * Manual premium unlocks (the host pays on WhatsApp, an admin records it here). "Mark paid" unlocks
 * the event's current template; "Revoke" removes a recorded unlock. Both are audit-logged by the API.
 */
export function PaymentActions({
  eventId,
  templateId,
  templateName,
  premium,
  payments,
}: {
  eventId: string;
  /** The event's current template as loaded on this page; the API rejects the payment if it has changed since. */
  templateId: string;
  templateName: string;
  premium: EventPremium | null;
  payments: AdminEventPayment[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [region, setRegion] = useState<Region | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(key: string, success: string, action: () => Promise<void>) {
    setPending(key);
    setError(null);
    setNotice(null);
    try {
      await action();
      setNotice(success);
      router.refresh();
    } catch (err) {
      setError(conflictMessage(err));
    } finally {
      setPending(null);
    }
  }

  const selected = premium?.prices.find((p) => p.region === region) ?? premium?.prices[0];

  function markPaid() {
    if (!premium || !selected) return;
    const amount = `${formatMoney(selected.currency, selected.amount_minor)} (${selected.currency}, ${REGION_LABELS[selected.region]})`;
    if (!confirm(`Mark "${templateName}" as paid for this event: ${amount} received? The host will be able to publish it.`)) return;
    const trimmed = note.trim();
    void run("pay", "Marked as paid.", async () => {
      await api(`/v1/admin/events/${eventId}/payments`, {
        method: "POST",
        json: { template_id: templateId, region: selected.region, amount_minor: selected.amount_minor, ...(trimmed && { note: trimmed }) },
      });
      setNote("");
    });
  }

  function revoke(p: AdminEventPayment) {
    if (!confirm(`Revoke the unlock for "${p.template_name}"? The event can't be re-published with it until it is paid again.`)) return;
    void run(`revoke:${p.template_id}`, "Unlock revoked.", () =>
      api(`/v1/admin/events/${eventId}/payments/${encodeURIComponent(p.template_id)}`, { method: "DELETE" }),
    );
  }

  const busy = pending !== null;

  return (
    <div className="flex flex-col gap-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm font-medium text-brand-heading">{notice}</p>}

      {premium ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            Current design <span className="font-medium">{templateName}</span> is premium.{" "}
            <Badge variant={premium.paid ? "secondary" : "outline"}>{premium.paid ? "Paid" : "Unpaid"}</Badge>
          </p>
          {!premium.paid && (
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                markPaid();
              }}
            >
              <fieldset className="grid gap-1">
                <legend className="mb-1 text-sm font-medium">Payment received in</legend>
                {premium.prices.map((p) => (
                  <label key={p.region} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="payment-region"
                      value={p.region}
                      checked={selected?.region === p.region}
                      onChange={() => setRegion(p.region)}
                      className="size-4 accent-primary"
                    />
                    {REGION_LABELS[p.region]}: {formatMoney(p.currency, p.amount_minor)} ({p.currency})
                  </label>
                ))}
              </fieldset>
              <Label htmlFor="payment-note">Note (optional)</Label>
              <Input
                id="payment-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                placeholder="e.g. UPI ref or WhatsApp chat date"
                autoComplete="off"
                className="max-w-md"
              />
              <div>
                <Button type="submit" disabled={busy}>
                  {pending === "pay" ? "Marking…" : "Mark paid"}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">The current design is free, so nothing to unlock.</p>
      )}

      {payments.length > 0 && (
        <ul className="flex flex-col gap-2 border-t pt-3 text-sm">
          {payments.map((p) => (
            <li key={p.template_id} className="flex flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-medium">{p.template_name}</span> · {REGION_LABELS[p.region]} · {formatMoney(p.currency, p.amount_minor)} ({p.currency}) · {formatDateTime(p.created_at)}
                {p.note ? <span className="text-muted-foreground"> · {p.note}</span> : null}
              </span>
              <Button type="button" variant="outline" disabled={busy} onClick={() => revoke(p)}>
                {pending === `revoke:${p.template_id}` ? "Revoking…" : "Revoke"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
