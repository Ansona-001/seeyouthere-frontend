import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { MediaListResponse, ModerationStatus } from "@/lib/api-types";
import { getDashboardEvent } from "@/lib/event";
import { serverApi } from "@/lib/server-api";

import { PhotosPanel } from "./photos-panel";

export const metadata: Metadata = { title: "Photos" };

const STATUSES: ModerationStatus[] = ["pending", "approved", "rejected"];

export default async function EventPhotosPage({
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

  const status = STATUSES.includes(query.status as ModerationStatus) ? (query.status as ModerationStatus) : "pending";
  const basePath = `/v1/events/${id}/media?uploaded_by=guest&status=${status}&limit=24`;
  const result = await serverApi<MediaListResponse>(basePath);

  if (!result.ok) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <PhotosPanel
      eventId={id}
      role={event.role}
      status={status}
      initialMedia={result.data.media}
      initialCursor={result.data.next_cursor}
      basePath={`/v1/events/${id}/media?uploaded_by=guest&status=${status}`}
    />
  );
}
