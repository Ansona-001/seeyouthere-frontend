"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { FutureDateTimeInput } from "@/components/future-datetime-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, ApiError, type Event } from "@/lib/api";

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Creating a hosted event: a short form (name, dates, venue), then straight to the site editor. It posts the same
 * `POST /v1/events` as the invite wizard, with `kind: "hosted"` on the stage occasion, whose answers fill the
 * website's hero, date and venue sections. There is no occasion or look to pick: the site's sections and style are
 * set in the editor.
 */
export function EventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [from, setFrom] = useState("");
  const [hasEnd, setHasEnd] = useState(false);
  const [to, setTo] = useState("");
  const [venue, setVenue] = useState("");
  const [entryPasses, setEntryPasses] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tz = browserTimezone();
  // "To" must come after "From" (both are zone-less ISO strings, so string order is time order).
  const rangeProblem = hasEnd && to !== "" ? (from === "" ? "Add the start date and time too." : to <= from ? "The end must be after the start." : null) : null;
  const canSubmit = title.trim() !== "" && from !== "" && rangeProblem === null && !pending;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPending(true);
    const answers: Record<string, string> = { title: title.trim(), from, timezone: tz };
    if (tagline.trim()) answers.tagline = tagline.trim();
    if (hasEnd && to) answers.to = to;
    if (venue.trim()) answers.venue = venue.trim();
    try {
      const { event } = await api<{ event: Event }>("/v1/events", {
        method: "POST",
        json: { occasion_slug: "function", kind: "hosted", entry_passes: entryPasses, answers },
      });
      router.push(`/edit/${event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="event-title">Event name</Label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={60}
          autoFocus
          placeholder="Spring Gala 2027"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="event-tagline">
          Tagline <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="event-tagline"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={120}
          placeholder="An evening of music and recognition"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="event-from">{hasEnd ? "Starts" : "Date and time"}</Label>
          <FutureDateTimeInput id="event-from" value={from} onValueChange={setFrom} timeZone={tz} required />
        </div>
        {hasEnd && (
          <div className="grid gap-1.5">
            <Label htmlFor="event-to">Ends</Label>
            <FutureDateTimeInput id="event-to" value={to} onValueChange={setTo} timeZone={tz} notBefore={from || undefined} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Switch
          id="event-has-end"
          checked={hasEnd}
          onCheckedChange={(on) => {
            setHasEnd(on);
            // Switching off drops any end already picked, so it can't be sent by accident.
            if (!on) setTo("");
          }}
        />
        <Label htmlFor="event-has-end" className="min-h-9">
          Runs over a range (add an end date and time)
        </Label>
      </div>
      {rangeProblem && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {rangeProblem}
        </p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="event-venue">
          Venue <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="event-venue"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          maxLength={120}
          placeholder="The Grand Hall"
        />
      </div>

      <div className="grid gap-1">
        <div className="flex items-center gap-3">
          <Switch id="event-passes" checked={entryPasses} onCheckedChange={setEntryPasses} />
          <Label htmlFor="event-passes" className="min-h-9">
            Give guests an entry pass (QR code)
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Guests who register get a QR code to show at the door. Turn it off if you only need registration. You can change
          this later in Settings.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!canSubmit}>
        {pending ? "Creating…" : "Create event website"}
      </Button>
    </form>
  );
}
