import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { OccasionsResponse, TemplatesResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { SetupWizard } from "./setup-wizard";

export async function generateMetadata({ params }: PageProps<"/create/[occasion]">): Promise<Metadata> {
  const { occasion } = await params;
  return { title: `Create a ${occasion.replace(/-/g, " ")} event` };
}

/**
 * Occasion-specific setup: setup questions -> template/palette/font pick ->
 * `POST /v1/events` (build-out plan §11.1, §11.4). The occasion and template
 * catalog are public and rarely change, so both fetches are cached for 5 min.
 */
export default async function CreateOccasionPage({ params }: PageProps<"/create/[occasion]">) {
  const { occasion: occasionSlug } = await params;

  const [occasionsResult, templatesResult] = await Promise.all([
    serverApi<OccasionsResponse>("/v1/occasions", { cache: "force-cache", next: { revalidate: 300 } }),
    serverApi<TemplatesResponse>(`/v1/templates?occasion=${encodeURIComponent(occasionSlug)}`, {
      cache: "force-cache",
      next: { revalidate: 300 },
    }),
  ]);

  if (!occasionsResult.ok) {
    return (
      <p role="alert" className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-destructive">
        {occasionsResult.message}
      </p>
    );
  }
  const occasion = occasionsResult.data.occasions.find((o) => o.slug === occasionSlug);
  if (!occasion) notFound();

  if (!templatesResult.ok) {
    return (
      <p role="alert" className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-destructive">
        {templatesResult.message}
      </p>
    );
  }
  if (templatesResult.data.templates.length === 0) {
    return (
      <p className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">
        No templates are available for this occasion yet. Please try again later.
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10">
      <SetupWizard occasion={occasion} templates={templatesResult.data.templates} />
    </div>
  );
}
