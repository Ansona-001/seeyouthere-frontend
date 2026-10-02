import type { Metadata } from "next";

import { getDashboardEvent } from "@/lib/event";

import { EventSettingsForm } from "./event-settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function EventSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventResult = await getDashboardEvent(id);
  if (!eventResult.ok) return null;
  const { event } = eventResult.data;

  if (event.role !== "owner") {
    return <p className="text-sm text-muted-foreground">Only the event owner can change settings.</p>;
  }

  return <EventSettingsForm event={event} />;
}
