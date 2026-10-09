import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/brand/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { EventsListResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { EventsList } from "./events-list";

export const metadata: Metadata = { title: "Your events" };

// Events list (build-out plan §4.3, §11.1): keyset-paginated, newest first,
// covering both owned events and ones the signed-in user co-hosts.
export default async function DashboardPage() {
  const result = await serverApi<EventsListResponse>("/v1/events?limit=25");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-brand-heading">Your events</h1>
        <Button render={<Link href="/create" />}>Create an event</Button>
      </header>

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : result.data.events.length === 0 ? (
        <EmptyState
          title="No events yet"
          action={<Button render={<Link href="/create" />}>Create your first event</Button>}
        >
          Birthday, housewarming, wedding? Create a free page and start collecting RSVPs in minutes.
        </EmptyState>
      ) : (
        <EventsList initialEvents={result.data.events} initialCursor={result.data.next_cursor} />
      )}
    </div>
  );
}
