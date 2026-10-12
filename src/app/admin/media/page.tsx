import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
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
      <h1 className="font-heading text-2xl text-brand-heading">Guest media</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1.5 text-sm font-semibold">
          Status
          <NativeSelect
            name="status"
            defaultValue={status}
            className="min-w-36"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </label>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : result.data.media.length === 0 ? (
        <p className="rounded-xl border border-dashed border-input bg-card px-4 py-6 text-center text-sm text-muted-foreground">No media with this status.</p>
      ) : (
        <MediaGrid initialMedia={result.data.media} initialCursor={result.data.next_cursor} basePath={basePath} />
      )}
    </div>
  );
}
