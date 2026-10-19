"use client";

import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError, type HostWish, type WishListResponse, type WishStatus } from "@/lib/api";

const PAGE_SIZE = 20;

const TABS: { value: WishStatus; label: string }[] = [
  { value: "approved", label: "On the invite" },
  { value: "hidden", label: "Hidden" },
];

const EMPTY_COPY: Record<WishStatus, string> = {
  pending: "No wishes.",
  approved: "No wishes yet. Wishes your guests send appear on the invite straight away.",
  hidden: "No hidden wishes.",
};

const NETWORK_ERROR = "Couldn't reach the server. Please try again.";

/** Guest wishes go live on submit; this lets the host hide, restore or delete them. */
export function WishesModeration({ eventId, onModerated }: { eventId: string; onModerated: () => void }) {
  const [tab, setTab] = useState<WishStatus | null>(null);
  const [wishes, setWishes] = useState<HostWish[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Guards against a slow response for a tab the user has already left.
  const requestRef = useRef(0);

  const base = `/v1/events/${encodeURIComponent(eventId)}/wishes`;

  async function load(status: WishStatus, after: string | null) {
    const request = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ status, limit: String(PAGE_SIZE) });
      if (after) qs.set("cursor", after);
      const res = await api<WishListResponse>(`${base}?${qs.toString()}`);
      if (request !== requestRef.current) return;
      setWishes((prev) => (after ? [...prev, ...res.wishes] : res.wishes));
      setCursor(res.next_cursor);
    } catch (err) {
      if (request !== requestRef.current) return;
      setError(err instanceof ApiError ? err.message : NETWORK_ERROR);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }

  function selectTab(status: WishStatus) {
    setTab(status);
    setWishes([]);
    setCursor(null);
    void load(status, null);
  }

  async function act(id: string, action: "approve" | "hide" | "delete") {
    if (action === "delete" && !confirm("Delete this wish? This can't be undone.")) return;
    setBusy(id);
    setError(null);
    try {
      if (action === "delete") {
        await api(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" });
      } else {
        await api(`${base}/${encodeURIComponent(id)}/${action}`, { method: "POST" });
      }
      // Every action moves the wish out of the current tab.
      setWishes((prev) => prev.filter((w) => w.id !== id));
      onModerated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : NETWORK_ERROR);
    } finally {
      setBusy(null);
    }
  }

  async function deleteAll(status: WishStatus) {
    if (!confirm("Delete all of these wishes? This can't be undone.")) return;
    setBusy("all");
    setError(null);
    try {
      await api(`${base}?status=${status}`, { method: "DELETE" });
      setWishes([]);
      setCursor(null);
      onModerated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : NETWORK_ERROR);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="wish-mod-heading" className="flex flex-col gap-3 border-t border-input pt-4">
      <h3 id="wish-mod-heading" className="text-sm font-medium">
        Guest wishes
      </h3>
      <div role="group" aria-label="Filter guest wishes by status" className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={tab === t.value}
            onClick={() => selectTab(t.value)}
            className={
              tab === t.value
                ? "inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
                : "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {tab === null ? (
        <p className="text-sm text-muted-foreground">Choose a tab to review the wishes your guests have sent.</p>
      ) : loading && wishes.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading…
        </p>
      ) : wishes.length === 0 ? (
        !error && <p className="text-sm text-muted-foreground">{EMPTY_COPY[tab]}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {wishes.map((w) => (
            <li key={w.id} className="flex flex-col gap-2 overflow-hidden rounded-xl border border-input bg-card p-3">
              <p className="whitespace-pre-line break-words text-sm">{w.message}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="break-words">{w.author}</span>
                <Badge
                  variant={w.status === "hidden" ? "destructive" : w.status === "approved" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {w.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {w.status !== "approved" && (
                  <Button type="button" size="sm" disabled={busy !== null} onClick={() => act(w.id, "approve")}>
                    {busy === w.id ? "…" : "Show again"}
                  </Button>
                )}
                {w.status !== "hidden" && (
                  <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={() => act(w.id, "hide")}>
                    Hide
                  </Button>
                )}
                <Button type="button" size="sm" variant="ghost" disabled={busy !== null} onClick={() => act(w.id, "delete")}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab !== null && wishes.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={busy !== null || loading}
          onClick={() => deleteAll(tab)}
        >
          {busy === "all" ? "Deleting…" : "Delete all"}
        </Button>
      )}

      {tab !== null && cursor && (
        <Button
          type="button"
          variant="outline"
          className="self-start"
          disabled={loading || busy !== null}
          onClick={() => load(tab, cursor)}
        >
          {loading ? "Loading…" : "Load more"}
        </Button>
      )}
    </section>
  );
}
