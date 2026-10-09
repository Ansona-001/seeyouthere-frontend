import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminReportsListResponse, ReportStatus } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { ReportsList } from "./reports-list";

export const metadata: Metadata = { title: "Admin: reports" };

const STATUSES: ReportStatus[] = ["open", "reviewing", "dismissed", "taken_down", "restored"];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminUser("/admin/reports");
  const params = await searchParams;
  const status = params.status && STATUSES.includes(params.status as ReportStatus) ? params.status : "open";

  const basePath = `/v1/admin/reports?status=${status}`;
  const result = await serverApi<AdminReportsListResponse>(basePath);
  redirectIfMfaRequired(result);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl text-brand-heading">Reports</h1>
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
      ) : result.data.reports.length === 0 ? (
        <p className="rounded-xl border border-dashed border-input bg-card px-4 py-6 text-center text-sm text-muted-foreground">No reports with this status.</p>
      ) : (
        <ReportsList
          initialReports={result.data.reports}
          initialCursor={result.data.next_cursor}
          basePath={basePath}
        />
      )}
    </div>
  );
}
