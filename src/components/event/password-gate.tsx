"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { GateShell } from "@/components/brand/gate-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";

/**
 * Gate for `visibility: "password"` events (build-out plan §4.4). On success
 * the API sets a signed `syt_pw_<event>` cookie; we `router.refresh()` so the
 * server component re-fetches the page with that cookie now attached, rather
 * than duplicating the event content in client state.
 */
export function PasswordGate({ slug }: { slug: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await api(`/v1/public/events/${encodeURIComponent(slug)}/unlock`, { method: "POST", json: { password } });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "wrong_password"
          ? "That password isn't right."
          : "Couldn't reach the server. Check your connection.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <GateShell title="This page is private">
      <p className="text-muted-foreground">Enter the password the host shared with you.</p>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <div className="grid gap-1.5 text-left">
          <Label htmlFor="event-password">Password</Label>
          <Input
            id="event-password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            minLength={8}
            maxLength={128}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "event-password-error" : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p id="event-password-error" role="alert" className="text-left text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Checking…" : "Continue"}
        </Button>
      </form>
    </GateShell>
  );
}
