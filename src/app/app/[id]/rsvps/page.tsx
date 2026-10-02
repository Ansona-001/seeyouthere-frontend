import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { AttendingStatus, RsvpsListResponse, RsvpSummary } from "@/lib/api-types";
import { getDashboardEvent } from "@/lib/event";
import { serverApi } from "@/lib/server-api";

import { RsvpsPanel } from "./rsvps-panel";

export const metadata: Metadata = { title: "RSVPs" };

const ATTENDING_VALUES: AttendingStatus[] = ["yes", "no", "maybe"];

export default async function EventRsvpsPage({
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

  const attending = ATTENDING_VALUES.includes(query.attending as AttendingStatus)
    ? (query.attending as AttendingStatus)
    : null;
  const basePath = `/v1/events/${id}/rsvps${attending ? `?attending=${attending}&limit=25` : "?limit=25"}`;

  const [listResult, summaryResult] = await Promise.all([
    serverApi<RsvpsListResponse>(basePath),
    serverApi<RsvpSummary>(`/v1/events/${id}/rsvps/summary`),
  ]);

  if (!listResult.ok) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{listResult.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <RsvpsPanel
      eventId={id}
      role={event.role}
      initialRsvps={listResult.data.rsvps}
      initialCursor={listResult.data.next_cursor}
      summary={summaryResult.ok ? summaryResult.data : null}
      attending={attending}
      basePath={`/v1/events/${id}/rsvps${attending ? `?attending=${attending}` : ""}`}
    />
  );
}
