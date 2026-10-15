"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";

const FIELD =
  "in-data-[ev-theme]:border-(--ev-text)/35! in-data-[ev-theme]:bg-(--ev-bg)! in-data-[ev-theme]:text-(--ev-text)!";

/** Guest wish submission. Wishes publish immediately; the host removes any they don't want. */
export function WishSubmitForm({ slug }: { slug: string }) {
  const router = useRouter();
  const formId = useId();
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setSent(false);
    setPending(true);
    try {
      await api<{ status: string }>(
        `/v1/public/events/${encodeURIComponent(slug)}/wishes`,
        {
          method: "POST",
          json: { author: author.trim(), message: message.trim(), website },
        },
      );
      setSent(true);
      setOpen(false);
      // Wishes publish immediately; re-render the server component so the new one shows up.
      router.refresh();
      setAuthor("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the server. Check your connection.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {sent && (
        <p
          role="status"
          className="rounded-lg bg-(--ev-surface) px-3 py-2 text-center text-sm text-(--ev-text)"
        >
          Thanks! Your wish is now on the invite.
        </p>
      )}
      <Button
        type="button"
        aria-expanded={open}
        aria-controls={`${formId}-form`}
        onClick={() => setOpen((o) => !o)}
        data-ev-cta=""
        className="bg-(--ev-accent) text-(--ev-accent-text) hover:opacity-90"
      >
        {open ? "Close" : sent ? "Leave another wish" : "Leave a wish"}
      </Button>
      {open && (
        <form
          id={`${formId}-form`}
          onSubmit={handleSubmit}
          className="relative flex w-full flex-col gap-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-author`}>Your name</Label>
            <Input
              className={FIELD}
              id={`${formId}-author`}
              required
              maxLength={80}
              autoComplete="name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={pending}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor={`${formId}-message`}>Your message</Label>
            <Textarea
              className={FIELD}
              id={`${formId}-message`}
              required
              maxLength={500}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={pending}
            />
          </div>

          {/* Honeypot: hidden from real visitors; a filled value makes the API silently no-op. */}
          <div
            className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden"
            aria-hidden="true"
          >
            <label htmlFor={`${formId}-website`}>Leave this field empty</label>
            <input
              id={`${formId}-website`}
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

          <Button
            type="submit"
            disabled={pending}
            data-ev-cta=""
            className="bg-(--ev-accent) text-(--ev-accent-text) hover:opacity-90"
          >
            {pending ? "Sending…" : "Send wish"}
          </Button>
        </form>
      )}
    </div>
  );
}
