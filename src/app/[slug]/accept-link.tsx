"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { GateShell } from "@/components/brand/gate-shell";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

type Props = {
  /** Route's own `[slug]` segment — only used as a "go back" link if the token turns out invalid. */
  slug: string;
  endpoint: "/v1/public/invites/accept" | "/v1/public/rsvp-links/accept";
  /** Builds the post-success destination from the slug the API resolved the token to. */
  redirectTo: (resolvedSlug: string) => string;
  emptyLinkMessage: string;
};

/**
 * Shared client logic for `/[slug]/invite` and `/[slug]/rsvp` (build-out plan
 * §11.1). Invite and RSVP-edit tokens travel only in the URL fragment, which
 * never reaches any server (path/query logs, Referer — §0, §12): we read it
 * once from `location.hash`, wipe it from the address bar immediately
 * regardless of outcome, then POST it in the request body.
 */
export function AcceptLink({ slug, endpoint, redirectTo, emptyLinkMessage }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    tokenRef.current = window.location.hash.slice(1) || null;
    history.replaceState(null, "", window.location.pathname);

    const token = tokenRef.current;
    if (!token) {
      setPending(false);
      setError(emptyLinkMessage);
      return;
    }

    (async () => {
      try {
        const result = await api<{ slug: string }>(endpoint, { method: "POST", json: { token } });
        router.replace(redirectTo(result.slug));
      } catch (err) {
        setPending(false);
        setError(
          err instanceof ApiError && err.status === 429
            ? "Too many attempts. Please try again in a few minutes."
            : "This link isn't valid anymore. Ask your host to resend it.",
        );
      }
    })();
    // Runs once on mount: the token only ever exists in the fragment on the
    // page's first load, and we've just cleared it above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (pending) {
    return (
      <GateShell title="Opening your invite…" as="h1">
        <p role="status" className="text-muted-foreground">
          One moment.
        </p>
      </GateShell>
    );
  }

  return (
    <GateShell title="Couldn't open this link">
      <p role="alert" className="text-muted-foreground">
        {error}
      </p>
      <Button variant="outline" render={<Link href={`/${slug}`} />} nativeButton={false}>
        Go to the event page
      </Button>
    </GateShell>
  );
}
