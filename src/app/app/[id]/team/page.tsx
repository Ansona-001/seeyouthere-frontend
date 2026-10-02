import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import type { MembersListResponse } from "@/lib/api-types";
import { getDashboardEvent } from "@/lib/event";
import { getCurrentUser } from "@/lib/session";
import { serverApi } from "@/lib/server-api";

import { TeamPanel } from "./team-panel";

export const metadata: Metadata = { title: "Team" };

export default async function EventTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventResult = await getDashboardEvent(id);
  if (!eventResult.ok) return null;
  const { event } = eventResult.data;
  const user = await getCurrentUser();

  const result = await serverApi<MembersListResponse>(`/v1/events/${id}/members`);
  if (!result.ok) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <TeamPanel
      eventId={id}
      viewerRole={event.role}
      viewerUserId={user?.id ?? null}
      initialMembers={result.data.members}
    />
  );
}
