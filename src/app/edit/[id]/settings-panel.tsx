"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
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

import type { EditorAction, EditorState } from "./reducer";

const VISIBILITY_LABEL: Record<Visibility, string> = {
  unlisted: "Unlisted — anyone with the link can view",
  password: "Password protected",
  invite_only: "Invite only — only invited guests can view",
  public: "Public — listed and searchable",
};

/**
 * Settings panel: slug (with live availability), visibility/password, RSVP
 * mode, notifications, publish/unpublish and delete (build-out plan §4.3,
 * §11.4). Settings and publish are owner-only; editors see a read-only note
 * and anonymous draft owners are asked to sign in first (§4.3, decision 4).
 */
export function SettingsPanel({
  state,
  dispatch,
  canPublish,
}: {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
  canPublish: boolean;
}) {
  const router = useRouter();

  if (state.role === "anon") {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm">
        <p className="text-muted-foreground">Sign in to choose a link and publish this event.</p>
        <Link href={`/login?next=${encodeURIComponent(`/edit/${state.id}`)}`} className={buttonVariants({})}>
          Sign in to publish
        </Link>
        <DeleteDraftButton eventId={state.id} isAnon onDeleted={() => router.push("/create")} />
      </div>
    );
  }

  if (state.role === "editor") {
    return <p className="text-sm text-muted-foreground">Only the event owner can change settings, publish or delete it.</p>;
  }

  return <OwnerSettings state={state} dispatch={dispatch} canPublish={canPublish} />;
}

function OwnerSettings({
  state,
  dispatch,
  canPublish,
}: {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState<string[] | null>(null);

  const [slugInput, setSlugInput] = useState(state.slug ?? "");
  const [slugCheck, setSlugCheck] = useState<SlugAvailability | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const slugLocked = state.publishedAt !== null;

  const [visibility, setVisibility] = useState<Visibility>(state.visibility);
  const [password, setPassword] = useState("");
  const [rsvpMode, setRsvpMode] = useState<RsvpMode>(state.rsvpMode);
  const [notifyRsvps, setNotifyRsvps] = useState(state.notifyRsvps);

  useEffect(() => {
    if (slugLocked || slugInput.trim() === "" || slugInput.trim().toLowerCase() === (state.slug ?? "")) return;
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

  // The availability result is only meaningful while it still matches the
  // current input; comparing here (instead of resetting state from the
  // effect above) avoids a synchronous setState call in the effect body.
  const currentSlugCheck = slugCheck && slugCheck.slug === slugInput.trim().toLowerCase() ? slugCheck : null;

  async function saveSettings(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const body: Record<string, unknown> = { version: state.version };
      if (!slugLocked && slugInput.trim() !== (state.slug ?? "")) body.slug = slugInput.trim();
      if (visibility !== state.visibility) body.visibility = visibility;
      if (password) body.password = password;
      if (rsvpMode !== state.rsvpMode) body.rsvp_mode = rsvpMode;
      if (notifyRsvps !== state.notifyRsvps) body.notify_rsvps = notifyRsvps;

      const { event } = await api<{ event: Event }>(`/v1/events/${state.id}/settings`, { method: "PATCH", json: body });
      dispatch({ type: "applied", event, templateSlug: event.template.slug });
      setPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.code === "version_conflict") {
        const details = err.details as { current_version: number } | undefined;
        dispatch({ type: "conflict", currentVersion: details?.current_version ?? state.version });
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
      const { event } = await api<{ event: Event }>(`/v1/events/${state.id}/publish`, { method: "POST", json: { version: state.version } });
      dispatch({ type: "applied", event, templateSlug: event.template.slug });
    } catch (err) {
      if (err instanceof ApiError && err.code === "not_ready") {
        const details = err.details as { missing: string[] } | undefined;
        setNotReady(details?.missing ?? []);
      } else if (err instanceof ApiError && err.code === "version_conflict") {
        const details = err.details as { current_version: number } | undefined;
        dispatch({ type: "conflict", currentVersion: details?.current_version ?? state.version });
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
      const { event } = await api<{ event: Event }>(`/v1/events/${state.id}/unpublish`, { method: "POST", json: { version: state.version } });
      dispatch({ type: "applied", event, templateSlug: event.template.slug });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={saveSettings} className="flex flex-col gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="settings-slug">Link</Label>
          {slugLocked ? (
            <p className="text-sm text-muted-foreground">
              {state.url ?? "seeuthere.at/" + (state.slug ?? "…")} <span className="text-xs">(can&rsquo;t be changed after publishing)</span>
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
              {currentSlugCheck?.available && <p className="text-xs text-brand-success">Available</p>}
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
            <Label htmlFor="settings-password">{state.hasPassword ? "Change password" : "Set a password"}</Label>
            <Input
              id="settings-password"
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder={state.hasPassword ? "Leave blank to keep the current password" : "8–128 characters"}
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
        <Button type="submit" disabled={pending || Boolean(currentSlugCheck && !currentSlugCheck.available)}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </form>

      <div className="flex flex-col gap-2 border-t pt-4">
        {notReady && (
          <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This event isn&rsquo;t ready to publish yet. Missing: {notReady.join(", ")}.
          </div>
        )}
        {state.status === "draft" && (
          <Button type="button" onClick={publish} disabled={pending || !canPublish}>
            Publish
          </Button>
        )}
        {(state.status === "published" || state.status === "hidden") && (
          <Button type="button" variant="outline" onClick={unpublish} disabled={pending}>
            {state.status === "published" ? "Unpublish" : "Republish"}
          </Button>
        )}
        {state.status === "taken_down" && (
          <p className="text-sm text-muted-foreground">This event has been taken down and can&rsquo;t be republished.</p>
        )}
        <DeleteDraftButton eventId={state.id} isAnon={false} onDeleted={() => router.push("/app")} />
      </div>
    </div>
  );
}

function DeleteDraftButton({ eventId, isAnon, onDeleted }: { eventId: string; isAnon: boolean; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      await api(`/v1/events/${eventId}`, { method: "DELETE" });
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>{isAnon ? "Delete draft" : "Delete event"}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isAnon ? "Delete this draft?" : "Delete this event?"}</DialogTitle>
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
