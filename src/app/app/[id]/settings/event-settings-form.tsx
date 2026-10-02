"use client";

import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api, ApiError, type Event, type RsvpMode, type SlugAvailability, type Visibility } from "@/lib/api";

const VISIBILITY_LABEL: Record<Visibility, string> = {
  unlisted: "Unlisted — anyone with the link can view",
  password: "Password protected",
  invite_only: "Invite only — only invited guests can view",
  public: "Public — listed and searchable",
};

/**
 * Standalone settings form for the dashboard's Settings tab (build-out plan
 * §4.3, §11.1). Owner-only (enforced by the page above). Mirrors the
 * editor's `settings-panel.tsx` field-by-field (same debounced slug check,
 * same publish/unpublish/delete calls) but works off a plain `Event` fetched
 * once for this page, rather than the editor's reducer state, so it can live
 * outside the block editor.
 */
export function EventSettingsForm({ event }: { event: Event }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState<string[] | null>(null);
  const [version, setVersion] = useState(event.version);

  const [slugInput, setSlugInput] = useState(event.slug ?? "");
  const [slugCheck, setSlugCheck] = useState<SlugAvailability | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugLocked = event.published_at !== null;

  const [visibility, setVisibility] = useState<Visibility>(event.visibility);
  const [password, setPassword] = useState("");
  const [rsvpMode, setRsvpMode] = useState<RsvpMode>(event.rsvp_mode);
  const [notifyRsvps, setNotifyRsvps] = useState(event.notify_rsvps);
  const [hasPassword, setHasPassword] = useState(event.has_password);
  const [status, setStatus] = useState(event.status);

  useEffect(() => {
    if (slugLocked || slugInput.trim() === "" || slugInput.trim().toLowerCase() === (event.slug ?? "")) return;
    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const result = await api<SlugAvailability>(`/v1/slugs/${encodeURIComponent(slugInput.trim().toLowerCase())}`);
        setSlugCheck(result);
      } catch {
        setSlugCheck(null);
      } finally {
        setCheckingSlug(false);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugInput]);

  const currentSlugCheck = slugCheck && slugCheck.slug === slugInput.trim().toLowerCase() ? slugCheck : null;

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body: Record<string, unknown> = { version };
      if (!slugLocked && slugInput.trim() !== (event.slug ?? "")) body.slug = slugInput.trim();
      if (visibility !== event.visibility) body.visibility = visibility;
      if (password) body.password = password;
      if (rsvpMode !== event.rsvp_mode) body.rsvp_mode = rsvpMode;
      if (notifyRsvps !== event.notify_rsvps) body.notify_rsvps = notifyRsvps;

      const { event: updated } = await api<{ event: Event }>(`/v1/events/${event.id}/settings`, {
        method: "PATCH",
        json: body,
      });
      setVersion(updated.version);
      setHasPassword(updated.has_password);
      setPassword("");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "version_conflict") {
        setError("This event was changed somewhere else. Reload to see the latest version.");
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  async function publish() {
    setError(null);
    setNotReady(null);
    setPending(true);
    try {
      const { event: updated } = await api<{ event: Event }>(`/v1/events/${event.id}/publish`, {
        method: "POST",
        json: { version },
      });
      setVersion(updated.version);
      setStatus(updated.status);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "not_ready") {
        const details = err.details as { missing: string[] } | undefined;
        setNotReady(details?.missing ?? []);
      } else if (err instanceof ApiError && err.code === "version_conflict") {
        setError("This event was changed somewhere else. Reload to see the latest version.");
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  async function unpublish() {
    setError(null);
    setPending(true);
    try {
      const { event: updated } = await api<{ event: Event }>(`/v1/events/${event.id}/unpublish`, {
        method: "POST",
        json: { version },
      });
      setVersion(updated.version);
      setStatus(updated.status);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <form onSubmit={saveSettings} className="flex flex-col gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="settings-slug">Link</Label>
          {slugLocked ? (
            <p className="text-sm text-muted-foreground">
              {event.url ?? "seeuthere.at/" + (event.slug ?? "…")}{" "}
              <span className="text-xs">(can&rsquo;t be changed after publishing)</span>
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>seeuthere.at/</span>
                <Input
                  id="settings-slug"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
                  maxLength={50}
                  className="flex-1"
                />
              </div>
              {checkingSlug && <p className="text-xs text-muted-foreground">Checking…</p>}
              {currentSlugCheck && !currentSlugCheck.available && (
                <p className="text-xs text-destructive">
                  {currentSlugCheck.reason === "taken" && "That link is already taken."}
                  {currentSlugCheck.reason === "blocked" && "That link isn't available."}
                  {currentSlugCheck.reason === "invalid" && "That's not a valid link."}
                </p>
              )}
              {currentSlugCheck?.available && <p className="text-xs text-green-700 dark:text-green-500">Available</p>}
            </>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="settings-visibility">Visibility</Label>
          <Select value={visibility} onValueChange={(v) => v && setVisibility(v as Visibility)}>
            <SelectTrigger id="settings-visibility" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((v) => (
                <SelectItem key={v} value={v}>
                  {VISIBILITY_LABEL[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {visibility === "password" && (
          <div className="grid gap-1.5">
            <Label htmlFor="settings-password">{hasPassword ? "Change password" : "Set a password"}</Label>
            <Input
              id="settings-password"
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder={hasPassword ? "Leave blank to keep the current password" : "8–128 characters"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="settings-rsvp-mode">RSVP mode</Label>
          <Select value={rsvpMode} onValueChange={(v) => v && setRsvpMode(v as RsvpMode)}>
            <SelectTrigger id="settings-rsvp-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open — anyone with the link can RSVP</SelectItem>
              <SelectItem value="invite_only">Invite only — only invited guests can RSVP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Switch id="settings-notify" checked={notifyRsvps} onCheckedChange={setNotifyRsvps} />
          <Label htmlFor="settings-notify">Email me when I get new RSVPs</Label>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending || Boolean(currentSlugCheck && !currentSlugCheck.available)} className="self-start">
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t pt-4">
        {notReady && (
          <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This event isn&rsquo;t ready to publish yet. Missing: {notReady.join(", ")}.
          </div>
        )}
        {status === "draft" && (
          <Button type="button" onClick={publish} disabled={pending} className="self-start">
            Publish
          </Button>
        )}
        {(status === "published" || status === "hidden") && (
          <Button type="button" variant="outline" onClick={unpublish} disabled={pending} className="self-start">
            {status === "published" ? "Unpublish" : "Republish"}
          </Button>
        )}
        {status === "taken_down" && (
          <p className="text-sm text-muted-foreground">This event has been taken down and can&rsquo;t be republished.</p>
        )}
        <DeleteEventButton eventId={event.id} />
      </div>
    </div>
  );
}

function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      await api(`/v1/events/${eventId}`, { method: "DELETE" });
      router.push("/app");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" className="self-start" />}>Delete event</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this event?</DialogTitle>
          <DialogDescription>This can&rsquo;t be undone. Guests, RSVPs and photos will be permanently removed.</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={pending} onClick={confirmDelete}>
            {pending ? "Deleting…" : "Permanently delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
