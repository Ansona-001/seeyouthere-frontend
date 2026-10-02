"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, ApiError, type Event } from "@/lib/api";

export function EventActions({ event, viewerRoles }: { event: Event & { owner_email: string }; viewerRoles: string[] }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [removeBranding, setRemoveBranding] = useState(event.remove_branding);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = viewerRoles.includes("super_admin");

  async function run(key: string, action: () => Promise<void>) {
    setPending(key);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  function takedown() {
    return run("takedown", () =>
      api(`/v1/admin/events/${event.id}/takedown`, { method: "POST", json: { reason: reason.slice(0, 500) } }),
    );
  }

  function restore() {
    return run("restore", () => api(`/v1/admin/events/${event.id}/restore`, { method: "POST" }));
  }

  function saveFlags(next: boolean) {
    setRemoveBranding(next);
    return run("flags", () =>
      api(`/v1/admin/events/${event.id}/flags`, { method: "PATCH", json: { remove_branding: next } }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-2">
        <Label htmlFor="takedown-reason">Reason (for takedown)</Label>
        <Input id="takedown-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </div>

      <div className="flex flex-wrap gap-2">
        {event.status === "taken_down" ? (
          <Button variant="outline" size="sm" disabled={pending !== null} onClick={restore}>
            {pending === "restore" ? "Restoring…" : "Restore"}
          </Button>
        ) : (
          <Button variant="destructive" size="sm" disabled={pending !== null} onClick={takedown}>
            {pending === "takedown" ? "Taking down…" : "Take down"}
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <div className="flex items-center gap-3 border-t pt-3">
          <Switch
            id="remove-branding"
            checked={removeBranding}
            disabled={pending !== null}
            onCheckedChange={saveFlags}
          />
          <Label htmlFor="remove-branding">Remove &ldquo;Made with See You There&rdquo; branding</Label>
        </div>
      )}
    </div>
  );
}
