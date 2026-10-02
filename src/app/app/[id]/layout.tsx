import { notFound } from "next/navigation";

import { getDashboardEvent } from "@/lib/event";

import { EventNav } from "./event-nav";

// Loads the event once per request (`getDashboardEvent` is `cache()`d, so the
// page under this layout reuses the same fetch) and gates every `/app/[id]/*`
// route on the caller having a role at all — the API's 404-for-no-role is
// the authoritative check (build-out plan §12 "IDOR"/"Enumeration"), this
// just turns it into Next's not-found boundary and builds role-filtered nav.
export default async function EventDashboardLayout({ children, params }: LayoutProps<"/app/[id]">) {
  const { id } = await params;
  const result = await getDashboardEvent(id);
  if (!result.ok) {
    if (result.status === 404) notFound();
    throw new Error(`GET /v1/events/${id} failed: ${result.status} ${result.code}`);
  }
  const { event } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <EventNav eventId={event.id} title={event.title} role={event.role} />
      {children}
    </div>
  );
}
