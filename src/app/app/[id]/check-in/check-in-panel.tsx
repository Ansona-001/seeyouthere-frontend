"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

import { EmptyState } from "@/components/brand/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  api,
  ApiError,
  type CheckInResult,
  type CheckInSummary,
  type Guest,
  type GuestsListResponse,
  type Registration,
  type RegistrationCheckIn,
  type RegistrationsListResponse,
} from "@/lib/api";

import { QrScanner } from "./qr-scanner";

const NETWORK_ERROR = "Couldn’t reach the server. Please try again.";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return "That pass isn’t valid for this event.";
    if (err.status === 409) return "That pass is for a different event.";
    if (err.status === 429)
      return "Too many attempts. Wait a moment and try again.";
    return err.message;
  }
  return NETWORK_ERROR;
}

export function CheckInPanel({
  eventId,
  initialSummary,
  initialGuests,
  initialCursor,
  initialRegistrations,
  initialRegistrationsCursor,
  role,
}: {
  eventId: string;
  initialSummary: CheckInSummary;
  initialGuests: Guest[];
  initialCursor: string | null;
  initialRegistrations: Registration[];
  initialRegistrationsCursor: string | null;
  role: string;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [guests, setGuests] = useState(initialGuests);
  const [cursor, setCursor] = useState(initialCursor);
  const [registrations, setRegistrations] = useState(initialRegistrations);
  const [regCursor, setRegCursor] = useState(initialRegistrationsCursor);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanResult, setScanResult] = useState<CheckInResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  async function refreshSummary() {
    try {
      setSummary(
        await api<CheckInSummary>(`/v1/events/${eventId}/check-ins/summary`),
      );
    } catch {
      // The numbers are stale, not wrong; the next action refreshes them.
    }
  }

  function applyRegistration(updated: PassUpdate) {
    setRegistrations((prev) =>
      prev.map((r) =>
        r.id === updated.id
          ? {
              ...r,
              checked_in_at: updated.checked_in_at,
              checked_in_count: updated.checked_in_count,
            }
          : r,
      ),
    );
    void refreshSummary();
  }

  function applyGuest(updated: PassUpdate) {
    setGuests((prev) =>
      prev.map((g) =>
        g.id === updated.id
          ? {
              ...g,
              checked_in_at: updated.checked_in_at,
              checked_in_count: updated.checked_in_count,
            }
          : g,
      ),
    );
    void refreshSummary();
  }

  function listPath(
    kind: "guests" | "registrations",
    q: string,
    after?: string,
  ) {
    const params = new URLSearchParams({ limit: "25" });
    if (q) params.set("q", q);
    if (after) params.set("cursor", after);
    return `/v1/events/${eventId}/${kind}?${params}`;
  }

  async function search(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setLoading(true);
    setError(null);
    try {
      const [g, r] = await Promise.all([
        api<GuestsListResponse>(listPath("guests", q)),
        api<RegistrationsListResponse>(listPath("registrations", q)),
      ]);
      setGuests(g.guests);
      setCursor(g.next_cursor);
      setRegistrations(r.registrations);
      setRegCursor(r.next_cursor);
      setSearched(q);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadMore(kind: "guests" | "registrations") {
    const after = kind === "guests" ? cursor : regCursor;
    if (!after) return;
    setLoading(true);
    setError(null);
    try {
      if (kind === "guests") {
        const res = await api<GuestsListResponse>(
          listPath(kind, searched, after),
        );
        setGuests((prev) => [...prev, ...res.guests]);
        setCursor(res.next_cursor);
      } else {
        const res = await api<RegistrationsListResponse>(
          listPath(kind, searched, after),
        );
        setRegistrations((prev) => [...prev, ...res.registrations]);
        setRegCursor(res.next_cursor);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onToken(token: string) {
    if (scanBusy) return;
    setScanBusy(true);
    setScanError(null);
    try {
      const result = await api<CheckInResult>("/v1/check-ins", {
        method: "POST",
        json: { token, event_id: eventId },
      });
      setScanResult(result);
      const scanned = {
        id: result.guest.id,
        checked_in_at: result.checked_in_at,
        checked_in_count: result.checked_in_count,
      };
      if (result.source === "registration") applyRegistration(scanned);
      else applyGuest(scanned);
    } catch (err) {
      setScanResult(null);
      setScanError(errorMessage(err));
    } finally {
      setScanBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat
          label="Checked in"
          value={`${summary.checked_in_people} of ${summary.expected_people}`}
          hint="people expected"
        />
        <Stat
          label="Passes in"
          value={`${summary.checked_in_passes} of ${summary.guests + summary.registrations}`}
          hint="guest list + registered"
        />
        <Stat
          label="Invited"
          value={String(summary.invited_people)}
          hint="people"
        />
        <Stat
          label="Still to come"
          value={String(
            Math.max(summary.expected_people - summary.checked_in_people, 0),
          )}
          hint="expected"
        />
      </dl>

      <section aria-labelledby="scan-heading" className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="scan-heading"
            className="font-heading text-xl text-brand-heading"
          >
            Scan a pass
          </h2>
          <Button
            variant={scanning ? "outline" : "default"}
            onClick={() => setScanning((on) => !on)}
            aria-pressed={scanning}
            className="min-h-11"
          >
            {scanning ? "Stop camera" : "Start camera"}
          </Button>
        </div>
        {scanning && <QrScanner onToken={(t) => void onToken(t)} />}
        <div aria-live="polite" className="grid gap-2">
          {scanBusy && (
            <p className="text-sm text-muted-foreground">Checking the pass…</p>
          )}
          {scanError && (
            <Alert variant="destructive">
              <AlertDescription>{scanError}</AlertDescription>
            </Alert>
          )}
          {scanResult && <ScanResult result={scanResult} />}
        </div>
      </section>

      <section aria-labelledby="guests-heading" className="grid gap-3">
        <h2
          id="guests-heading"
          className="font-heading text-xl text-brand-heading"
        >
          Find a guest
        </h2>
        <form onSubmit={search} role="search" className="flex gap-2">
          <Input
            type="search"
            aria-label="Search guests by name"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
            autoComplete="off"
          />
          <Button type="submit" disabled={loading} className="min-h-11">
            {loading ? "Searching…" : "Search"}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertDescription role="alert">{error}</AlertDescription>
          </Alert>
        )}

        <div
          className="grid gap-2"
          aria-labelledby="guest-list-heading"
          role="group"
        >
          <h3
            id="guest-list-heading"
            className="text-sm font-semibold text-muted-foreground"
          >
            Guest list
          </h3>
          {guests.length === 0 ? (
            <EmptyState title={searched ? "No guests match" : "No guests yet"}>
              {searched
                ? "Try a different spelling."
                : "Add guests on the Guests tab and they will show up here."}
            </EmptyState>
          ) : (
            <ul className="grid gap-2">
              {guests.map((g) => (
                <PassRow
                  key={g.id}
                  name={g.name}
                  max={g.household_size}
                  checkedInCount={g.checked_in_count}
                  suggested={
                    g.rsvp?.attending === "yes"
                      ? g.rsvp.count
                      : g.household_size
                  }
                  status={g.rsvp ? `RSVP: ${g.rsvp.attending}` : "No RSVP"}
                  path={`/v1/events/${eventId}/guests/${g.id}/check-in`}
                  canUndo={role !== "viewer"}
                  onChange={applyGuest}
                />
              ))}
            </ul>
          )}
          {cursor && (
            <Button
              variant="outline"
              onClick={() => void loadMore("guests")}
              disabled={loading}
              className="min-h-11 justify-self-center"
            >
              {loading ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>

        <div
          className="grid gap-2"
          aria-labelledby="registered-heading"
          role="group"
        >
          <h3
            id="registered-heading"
            className="text-sm font-semibold text-muted-foreground"
          >
            Registered
          </h3>
          {registrations.length === 0 ? (
            <EmptyState
              title={
                searched ? "No registrations match" : "No registrations yet"
              }
            >
              {searched
                ? "Try a different spelling."
                : "People who register from your event link will show up here."}
            </EmptyState>
          ) : (
            <ul className="grid gap-2">
              {registrations.map((r) => (
                <PassRow
                  key={r.id}
                  name={r.name}
                  max={Math.max(r.count, 1)}
                  checkedInCount={r.checked_in_count}
                  suggested={r.count}
                  status={`RSVP: ${r.attending}`}
                  email={r.email}
                  noPass={r.attending !== "yes"}
                  path={`/v1/events/${eventId}/rsvps/${r.id}/check-in`}
                  canUndo={role !== "viewer"}
                  onChange={applyRegistration}
                />
              ))}
            </ul>
          )}
          {regCursor && (
            <Button
              variant="outline"
              onClick={() => void loadMore("registrations")}
              disabled={loading}
              className="min-h-11 justify-self-center"
            >
              {loading ? "Loading…" : "Load more"}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-border">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl text-brand-heading">{value}</dd>
      <dd className="text-xs text-muted-foreground">{hint}</dd>
    </div>
  );
}

function ScanResult({ result }: { result: CheckInResult }) {
  const again = result.result === "already_checked_in";
  const people = result.guest.household_size;
  return (
    <div className="grid gap-1 rounded-2xl bg-card p-4 ring-1 ring-border">
      <p className="font-heading text-xl text-brand-heading">
        {again ? "Already checked in" : "Checked in"}: {result.guest.name}
      </p>
      <p className="text-sm text-muted-foreground">
        {result.checked_in_count} of {people} arrived
        {result.rsvp
          ? ` · RSVP: ${result.rsvp.attending} (${result.rsvp.count})`
          : " · no RSVP"}
        {again && result.checked_in_by_name
          ? ` · by ${result.checked_in_by_name}`
          : ""}
      </p>
      {result.rsvp?.attending === "no" && (
        <p className="text-sm font-medium">
          This guest replied that they can’t come.
        </p>
      )}
    </div>
  );
}

type PassUpdate = {
  id: string;
  checked_in_at: string | null;
  checked_in_count: number;
};

/** One door-check-in row, shared by guest-list entries and registrations (same `{count}` PUT, different route). */
function PassRow({
  name,
  max,
  checkedInCount,
  suggested,
  status,
  email,
  noPass = false,
  path,
  canUndo,
  onChange,
}: {
  name: string;
  max: number;
  checkedInCount: number;
  suggested: number;
  status: string;
  email?: string | null;
  /** Registrations that didn't say yes have no pass to check in. */
  noPass?: boolean;
  path: string;
  canUndo: boolean;
  onChange: (u: PassUpdate) => void;
}) {
  const checkedIn = checkedInCount > 0;
  const [count, setCount] = useState(() =>
    Math.min(Math.max(checkedIn ? checkedInCount : suggested, 1), max),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: number) {
    setPending(true);
    setError(null);
    try {
      const updated = await api<PassUpdate | RegistrationCheckIn>(path, {
        method: "PUT",
        json: { count: next },
      });
      onChange(updated);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="grid gap-2 rounded-2xl bg-card p-3 ring-1 ring-border">
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate font-semibold">{name}</p>
        <p
          className={`shrink-0 text-sm ${checkedIn ? "font-semibold text-brand-success" : "text-muted-foreground"}`}
        >
          {checkedIn ? `${checkedInCount} of ${max} in` : status}
        </p>
      </div>
      {email && (
        <p className="truncate text-sm text-muted-foreground">{email}</p>
      )}
      {noPass && !checkedIn && (
        <p className="text-sm text-muted-foreground">
          No entry pass: they didn’t reply yes.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {max > 1 && (
          <div
            role="group"
            aria-label={`People arriving with ${name}`}
            className="flex items-center gap-1"
          >
            <Button
              variant="outline"
              size="icon"
              aria-label="One fewer person"
              disabled={pending || count <= 1}
              onClick={() => setCount((c) => Math.max(c - 1, 1))}
            >
              <MinusIcon />
            </Button>
            <span
              aria-live="polite"
              className="min-w-14 text-center font-semibold"
            >
              {count} of {max}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="One more person"
              disabled={pending || count >= max}
              onClick={() => setCount((c) => Math.min(c + 1, max))}
            >
              <PlusIcon />
            </Button>
          </div>
        )}
        {(!noPass || checkedIn) && (
          <Button
            className="min-h-11"
            disabled={pending || (checkedIn && count === checkedInCount)}
            onClick={() => void save(count)}
          >
            {pending ? "Saving…" : checkedIn ? "Update" : "Check in"}
          </Button>
        )}
        {checkedIn && canUndo && (
          <Button
            variant="outline"
            className="min-h-11"
            disabled={pending}
            onClick={() => void save(0)}
          >
            Undo
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}
