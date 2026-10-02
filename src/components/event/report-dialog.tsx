"use client";

import { useEffect, useState, type FormEvent } from "react";

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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

const REASONS = [
  { value: "phishing", label: "Phishing or scam" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "illegal", label: "Illegal content" },
  { value: "other", label: "Something else" },
] as const;

/**
 * "Report this page" (build-out plan §4.4, §11.3). Self-contained: opens from
 * its own trigger, or automatically when the URL hash is `#report` (footer
 * links and invite emails both point at `<slug>#report`).
 */
export function ReportDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // window.location is only readable client-side after mount; this runs
    // once, so it's the documented exception to react-hooks/set-state-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.location.hash === "#report") setOpen(true);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setError(null);
    setPending(true);
    try {
      await api(`/v1/public/events/${encodeURIComponent(slug)}/reports`, {
        method: "POST",
        json: { reason, details, website },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setDone(false);
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={<button type="button" className="text-(--ev-muted) underline-offset-4 hover:underline" />}
      >
        Report this page
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this page</DialogTitle>
          <DialogDescription>Let us know if this page looks like spam, a scam, or something worse.</DialogDescription>
        </DialogHeader>
        {done ? (
          <p role="status" className="py-2 text-sm">
            Thanks — our team will take a look.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="report-reason">Reason</Label>
              <Select value={reason} onValueChange={(value) => setReason(value ?? "")}>
                <SelectTrigger id="report-reason" className="w-full">
                  <SelectValue placeholder="Choose a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="report-details">Details (optional)</Label>
              <Textarea
                id="report-details"
                maxLength={1000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
            {/* Honeypot: hidden from real visitors; a filled value makes the API silently no-op. */}
            <div className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
              <label htmlFor="report-website">Leave this field empty</label>
              <input
                id="report-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending || !reason}>
                {pending ? "Sending…" : "Send report"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
