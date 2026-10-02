import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminMediaListResponse, ModerationStatus } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { MediaGrid } from "./media-grid";

export const metadata: Metadata = { title: "Admin: media" };

const STATUSES: ModerationStatus[] = ["pending", "approved", "rejected"];

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminUser("/admin/media");
  const params = await searchParams;
  const status = params.status && STATUSES.includes(params.status as ModerationStatus) ? params.status : "pending";

  const basePath = `/v1/admin/media?status=${status}`;
  const result = await serverApi<AdminMediaListResponse>(basePath);
  redirectIfMfaRequired(result);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold">Guest media</h1>
      <form method="get" className="flex items-end gap-3">
        <label className="grid gap-1.5 text-sm">
          Status
          <select
            name="status"
            defaultValue={status}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
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
      ) : result.data.media.length === 0 ? (
        <p className="text-sm text-muted-foreground">No media with this status.</p>
      ) : (
        <MediaGrid initialMedia={result.data.media} initialCursor={result.data.next_cursor} basePath={basePath} />
      )}
    </div>
  );
}
