import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminEventsListResponse, EventStatus } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { EventsTable } from "./events-table";

export const metadata: Metadata = { title: "Admin: events" };

const STATUSES: EventStatus[] = ["draft", "published", "hidden", "taken_down"];

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminUser("/admin/events");
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 80);
  const status = params.status && STATUSES.includes(params.status as EventStatus) ? params.status : "";

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  const basePath = `/v1/admin/events${query.size ? `?${query}` : ""}`;

  const result = await serverApi<AdminEventsListResponse>(basePath);
  redirectIfMfaRequired(result);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold">Events</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={q} placeholder="Title or slug" className="w-56" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-8 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Filter
        </button>
      </form>

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : result.data.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events match.</p>
      ) : (
        <EventsTable
          initialEvents={result.data.events}
          initialCursor={result.data.next_cursor}
          basePath={basePath}
        />
      )}
    </div>
  );
}
