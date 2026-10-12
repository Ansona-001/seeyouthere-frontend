import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminTemplateDetail } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { TemplateDetail } from "./template-detail";

export const metadata: Metadata = { title: "Admin: template" };

export default async function AdminTemplateDetailPage({ params }: PageProps<"/admin/templates/[id]">) {
  await requireAdminUser("/admin/templates");
  const { id } = await params;
  const result = await serverApi<AdminTemplateDetail>(`/v1/admin/templates/${id}`);
  redirectIfMfaRequired(result);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p role="alert" className="text-sm text-destructive">
        {result.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/templates" className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:underline">
          ← Templates
        </Link>
        <h1 className="font-heading text-2xl text-brand-heading">{result.data.name}</h1>
      </div>
      <TemplateDetail template={result.data} />
    </div>
  );
}
