import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminEventDetail } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { serverApi } from "@/lib/server-api";

import { EventActions } from "./event-actions";

export const metadata: Metadata = { title: "Admin: event" };

export default async function AdminEventDetailPage({ params }: PageProps<"/admin/events/[id]">) {
  const viewer = await requireAdminUser("/admin/events");
  const { id } = await params;
  const result = await serverApi<AdminEventDetail>(`/v1/admin/events/${id}`);
  redirectIfMfaRequired(result);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p role="alert" className="text-sm text-destructive">
        {result.message}
      </p>
    );
  }

  const { event, counts, reports } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/events" className="text-sm text-muted-foreground hover:underline">
          ← Events
        </Link>
        <h1 className="font-heading text-2xl font-bold">{event.title || "(untitled)"}</h1>
        <p className="text-muted-foreground">
          {event.owner_email} · {event.occasion_slug} · <Badge variant="outline">{event.status}</Badge>
        </p>
        {event.url && (
          <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
            {event.url}
          </a>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
          <CardDescription>
            {counts.rsvps} RSVPs · {counts.guests} guests · {counts.media} media files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventActions event={event} viewerRoles={viewer.roles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports for this event.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {reports.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0 last:pb-0">
                  <span>
                    <span className="font-medium">{r.reason}</span>
                    {r.details ? `: ${r.details}` : ""}
                  </span>
                  <span className="text-muted-foreground">
                    <Badge variant="outline">{r.status}</Badge> {formatDateTime(r.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
