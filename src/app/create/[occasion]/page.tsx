import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/brand/empty-state";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";
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

  const failure = !occasionsResult.ok
    ? occasionsResult.message
    : !templatesResult.ok
      ? templatesResult.message
      : null;
  if (failure !== null) {
    return (
      <CreateShell>
        <EmptyState
          title="We couldn't load this page"
          action={
            <Button variant="outline" render={<Link href="/create" />} nativeButton={false}>
              Back to occasions
            </Button>
          }
        >
          <span role="alert">{failure}</span>
        </EmptyState>
      </CreateShell>
    );
  }
  if (!occasionsResult.ok || !templatesResult.ok) return null;

  const occasion = occasionsResult.data.occasions.find((o) => o.slug === occasionSlug);
  if (!occasion) notFound();

  if (templatesResult.data.templates.length === 0) {
    return (
      <CreateShell>
        <EmptyState
          title="No templates yet"
          action={
            <Button variant="outline" render={<Link href="/create" />} nativeButton={false}>
              Back to occasions
            </Button>
          }
        >
          There are no templates for this occasion yet. Please try again later.
        </EmptyState>
      </CreateShell>
    );
  }

  return (
    <CreateShell wide>
      <SetupWizard occasion={occasion} templates={templatesResult.data.templates} />
    </CreateShell>
  );
}

function CreateShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <>
      <SiteHeader />
      <main
        className={`mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14 ${wide ? "max-w-5xl" : "max-w-xl"}`}
      >
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
