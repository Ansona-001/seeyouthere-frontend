import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CheckInSummary, GuestsListResponse, RegistrationsListResponse } from "@/lib/api-types";
import { getDashboardEvent } from "@/lib/event";
import { serverApi } from "@/lib/server-api";

import { CheckInPanel } from "./check-in-panel";

export const metadata: Metadata = { title: "Check-in" };

// Door check-in exists only for hosted events; every event member (including viewers, i.e. door staff) can
// mark arrivals. The API enforces access on every call.
export default async function EventCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventResult = await getDashboardEvent(id);
  if (!eventResult.ok) return null;
  const { event } = eventResult.data;
  if (event.kind !== "hosted") notFound();

  const [summary, guests, registrations] = await Promise.all([
    serverApi<CheckInSummary>(`/v1/events/${id}/check-ins/summary`),
    serverApi<GuestsListResponse>(`/v1/events/${id}/guests?limit=25`),
    serverApi<RegistrationsListResponse>(`/v1/events/${id}/registrations?limit=25`),
  ]);
  if (!summary.ok || !guests.ok || !registrations.ok) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{!summary.ok ? summary.message : !guests.ok ? guests.message : !registrations.ok ? registrations.message : ""}</AlertDescription>
      </Alert>
    );
  }

  return (
    <CheckInPanel
      eventId={id}
      role={event.role}
      initialSummary={summary.data}
      initialGuests={guests.data.guests}
      initialCursor={guests.data.next_cursor}
      initialRegistrations={registrations.data.registrations}
      initialRegistrationsCursor={registrations.data.next_cursor}
    />
  );
}
