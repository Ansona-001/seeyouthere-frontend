import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RsvpSummary } from "@/lib/api-types";
import { getDashboardEvent } from "@/lib/event";
import { serverApi } from "@/lib/server-api";

import { OverviewActions } from "./overview-actions";

export const metadata: Metadata = { title: "Overview" };

// Overview (build-out plan §11.1): key stats, publish/preview/edit. The RSVP
// summary call is against §4.5's contract — see the send-off report for the
// gap: those host endpoints (GET .../rsvps/summary etc.) aren't implemented
// on the backend yet, so this renders its own error state until they land.
export default async function EventOverviewPage({ params }: PageProps<"/app/[id]">) {
  const { id } = await params;
  const eventResult = await getDashboardEvent(id);
  if (!eventResult.ok) return null; // layout already notFound()s / throws
  const { event } = eventResult.data;

  const summaryResult = await serverApi<RsvpSummary>(`/v1/events/${id}/rsvps/summary`);
  const summary = summaryResult.ok ? summaryResult.data : null;

  return (
    <div className="flex flex-col gap-6">
      <OverviewActions event={event} />

      {!summaryResult.ok ? (
        <Alert variant="destructive">
          <AlertDescription>Couldn&rsquo;t load RSVP stats: {summaryResult.message}</AlertDescription>
        </Alert>
      ) : summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Yes" value={summary.yes} sub={`${summary.yes_heads} guest${summary.yes_heads === 1 ? "" : "s"}`} />
          <StatCard label="Maybe" value={summary.maybe} sub={`${summary.maybe_heads} guest${summary.maybe_heads === 1 ? "" : "s"}`} />
          <StatCard label="No" value={summary.no} />
          <StatCard
            label="Guests responded"
            value={summary.guests_responded}
            sub={`of ${summary.guests_total} invited`}
          />
        </div>
      ) : null}

      {summary?.capacity != null && (
        <p className="text-sm text-muted-foreground">
          Capacity: {summary.yes_heads} / {summary.capacity} spots filled.
        </p>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
