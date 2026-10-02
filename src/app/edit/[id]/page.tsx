import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Event, OccasionsResponse, TemplatesResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { Editor } from "./editor";

export const metadata: Metadata = { title: "Edit your event" };

/**
 * Event builder/editor (build-out plan §11.1, §11.4). Works for a signed-in
 * member (session cookie) or an anonymous draft owner (`syt_draft` cookie) —
 * `serverApi` forwards whichever `syt_*` cookies are present, and the API
 * returns 404 either way when neither grants access (never 401, so this page
 * never leaks whether an id exists to someone without access).
 */
export default async function EditEventPage({ params }: PageProps<"/edit/[id]">) {
  const { id } = await params;

  const eventResult = await serverApi<{ event: Event }>(`/v1/events/${encodeURIComponent(id)}`);
  if (!eventResult.ok) {
    if (eventResult.status === 404) notFound();
    return (
      <p role="alert" className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-destructive">
        {eventResult.message}
      </p>
    );
  }
  const event = eventResult.data.event;

  if (event.role === "viewer") {
    return (
      <p className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        You have view-only access to this event. Ask the owner for editor access to make changes.
      </p>
    );
  }

  const [occasionsResult, templatesResult] = await Promise.all([
    serverApi<OccasionsResponse>("/v1/occasions", { cache: "force-cache", next: { revalidate: 300 } }),
    serverApi<TemplatesResponse>(`/v1/templates?occasion=${encodeURIComponent(event.occasion_slug)}`, {
      cache: "force-cache",
      next: { revalidate: 300 },
    }),
  ]);
  const occasion = occasionsResult.ok ? occasionsResult.data.occasions.find((o) => o.slug === event.occasion_slug) ?? null : null;
  const templates = templatesResult.ok ? templatesResult.data.templates : [];

  return <Editor initialEvent={event} occasion={occasion} templates={templates} />;
}
