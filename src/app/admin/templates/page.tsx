import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminTemplatesListResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { NewTemplateDialog } from "./new-template-dialog";
import { TemplatesList } from "./templates-list";

export const metadata: Metadata = { title: "Admin: templates" };

export default async function AdminTemplatesPage() {
  await requireAdminUser("/admin/templates");
  const result = await serverApi<AdminTemplatesListResponse>("/v1/admin/templates");
  redirectIfMfaRequired(result);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Templates</h1>
        <NewTemplateDialog />
      </div>

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : result.data.templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No templates yet.</p>
      ) : (
        <TemplatesList templates={result.data.templates} />
      )}
    </div>
  );
}
