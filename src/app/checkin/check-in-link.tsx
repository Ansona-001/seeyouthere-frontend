"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GateShell } from "@/components/brand/gate-shell";
import { Button } from "@/components/ui/button";
import { api, ApiError, type CheckInResult } from "@/lib/api";

type State =
  | { kind: "ready" }
  | { kind: "pending" }
  | { kind: "done"; result: CheckInResult }
  | { kind: "pass" }
  | { kind: "limited" }
  | { kind: "error" };

/**
 * Opened when a host scans a guest's pass with the phone's camera app. The token travels only in the URL
 * fragment (never in a server log or Referer): read it once, wipe it from the address bar and keep it in
 * memory. Nothing is sent until the host taps the button, so merely opening the link never admits anyone.
 * Whoever isn't a host of that event (or isn't signed in) sees the same "show it at the door" message, so the
 * page never reveals whether a pass is valid.
 */
export function CheckInLink() {
  const [state, setState] = useState<State>({ kind: "pending" });
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = window.location.hash.slice(1);
    history.replaceState(null, "", window.location.pathname);
    void Promise.resolve().then(() => {
      if (t) {
        setToken(t);
        setState({ kind: "ready" });
      } else {
        setState({ kind: "pass" });
      }
    });
  }, []);

  async function checkIn() {
    setState({ kind: "pending" });
    try {
      const result = await api<CheckInResult>("/v1/check-ins", {
        method: "POST",
        json: { token },
      });
      setToken("");
      setState({ kind: "done", result });
    } catch (err) {
      if (err instanceof ApiError && err.status === 429)
        setState({ kind: "limited" });
      else if (
        err instanceof ApiError &&
        [400, 401, 403, 404, 409].includes(err.status)
      )
        setState({ kind: "pass" });
      else setState({ kind: "error" });
    }
  }

  if (state.kind === "ready") {
    return (
      <GateShell title="Entry pass">
        <p className="text-muted-foreground">
          Check this guest in at the door. This can only be done by the event’s
          hosts and door staff.
        </p>
        <Button className="min-h-11" onClick={() => void checkIn()}>
          Check in this pass
        </Button>
      </GateShell>
    );
  }

  if (state.kind === "pending") {
    return (
      <GateShell title="Checking the pass…">
        <p role="status" className="text-muted-foreground">
          One moment.
        </p>
      </GateShell>
    );
  }

  if (state.kind === "done") {
    const { result } = state;
    const again = result.result === "already_checked_in";
    return (
      <GateShell title={again ? "Already checked in" : "Checked in"}>
        <div role="status" className="grid gap-1">
          <p className="text-xl font-semibold">{result.guest.name}</p>
          <p className="text-muted-foreground">{result.event_title}</p>
          <p>
            {result.checked_in_count} of {result.guest.household_size}{" "}
            {result.guest.household_size === 1 ? "person" : "people"} arrived
          </p>
          {again && result.checked_in_by_name && (
            <p className="text-sm text-muted-foreground">
              Checked in by {result.checked_in_by_name}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          render={<Link href={`/app/${result.event_id}/check-in`} />}
          nativeButton={false}
        >
          Open check-in
        </Button>
      </GateShell>
    );
  }

  const message =
    state.kind === "limited"
      ? "Too many attempts. Please try again in a few minutes."
      : state.kind === "error"
        ? "Couldn’t reach the server. Please scan the pass again."
        : "This is an entry pass. Show it at the door.";

  return (
    <GateShell title="Entry pass">
      <p
        role={state.kind === "pass" ? "status" : "alert"}
        className="text-muted-foreground"
      >
        {message}
      </p>
    </GateShell>
  );
}
