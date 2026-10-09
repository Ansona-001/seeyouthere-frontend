"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Event } from "@/lib/api";

const STATUS_LABEL: Record<Event["status"], string> = {
  draft: "Draft",
  published: "Published",
  hidden: "Unpublished",
  taken_down: "Taken down",
};

/** Key stats header: status, share link + copy, publish/preview/edit (§4.3, §11.1). */
export function OverviewActions({ event }: { event: Event }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notReady, setNotReady] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const canEdit = event.role === "owner" || event.role === "editor";
  const canPublish = event.role === "owner";

  async function publish() {
    setError(null);
    setNotReady(null);
    setPending(true);
    try {
      await api(`/v1/events/${event.id}/publish`, { method: "POST", json: { version: event.version } });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === "not_ready") {
        const details = err.details as { missing: string[] } | undefined;
        setNotReady(details?.missing ?? []);
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    if (!event.url) return;
    try {
      await navigator.clipboard.writeText(event.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the browser; the URL is still
      // visible as text for the host to copy by hand.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={event.status === "taken_down" ? "destructive" : event.status === "published" ? "default" : "outline"}>{STATUS_LABEL[event.status]}</Badge>
        {event.url ? (
          <div className="flex items-center gap-1.5 text-sm">
            <a href={event.url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-primary underline-offset-4 hover:underline">
              {event.url}
            </a>
            <Button type="button" variant="ghost" onClick={copyLink}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No link set yet</span>
        )}
      </div>

      {notReady && (
        <div role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          This event isn&rsquo;t ready to publish yet. Missing: {notReady.join(", ")}. Set these in{" "}
          <Link href={`/app/${event.id}/settings`} className="underline">
            Settings
          </Link>
          .
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button variant="outline" render={<Link href={`/edit/${event.id}`} />}>
            Edit content
          </Button>
        )}
        {event.url && (
          <Button variant="outline" render={<a href={event.url} target="_blank" rel="noopener noreferrer" />}>
            Preview
          </Button>
        )}
        {canPublish && event.status === "draft" && (
          <Button type="button" onClick={publish} disabled={pending}>
            {pending ? "Publishing…" : "Publish"}
          </Button>
        )}
      </div>
    </div>
  );
}
