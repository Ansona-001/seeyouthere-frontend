import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminAuditListResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { AuditList } from "./audit-list";

export const metadata: Metadata = { title: "Admin: audit log" };

export default async function AdminAuditPage() {
  await requireAdminUser("/admin/audit");
  const result = await serverApi<AdminAuditListResponse>("/v1/admin/audit");
  redirectIfMfaRequired(result);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-bold">Audit log</h1>

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : result.data.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <AuditList initialEntries={result.data.entries} initialCursor={result.data.next_cursor} />
      )}
    </div>
  );
}
