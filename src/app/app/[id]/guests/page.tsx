import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { GuestsListResponse } from "@/lib/api-types";
import { getDashboardEvent } from "@/lib/event";
import { serverApi } from "@/lib/server-api";

import { GuestsPanel } from "./guests-panel";

export const metadata: Metadata = { title: "Guests" };

export default async function EventGuestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const eventResult = await getDashboardEvent(id);
  if (!eventResult.ok) return null;
  const { event } = eventResult.data;

  const q = query.q?.trim() ?? "";
  const basePath = `/v1/events/${id}/guests${q ? `?q=${encodeURIComponent(q)}&limit=25` : "?limit=25"}`;
  const result = await serverApi<GuestsListResponse>(basePath);

  if (!result.ok) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <GuestsPanel
      eventId={id}
      role={event.role}
      published={event.status === "published"}
      initialGuests={result.data.guests}
      initialCursor={result.data.next_cursor}
      initialQuery={q}
      basePath={`/v1/events/${id}/guests${q ? `?q=${encodeURIComponent(q)}` : ""}`}
    />
  );
}
