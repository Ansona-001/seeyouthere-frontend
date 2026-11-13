import type { Metadata } from "next";

import { Analytics } from "@/components/analytics";
import { EmptyState } from "@/components/brand/empty-state";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import type { OccasionsResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { OccasionCoverflow } from "./occasion-coverflow";

export const metadata: Metadata = {
  title: "Create an event",
  description: "Pick an occasion and design a free online invitation with RSVPs in minutes.",
  alternates: { canonical: "/create" },
};

/**
 * Occasion picker (build-out plan §11.1). Works for signed-in and anonymous
 * visitors alike — creating a draft doesn't require an account (§4.3, decision
 * 4: drafts are claimed at login, not at creation).
 */
export default async function CreatePage() {
  const result = await serverApi<OccasionsResponse>("/v1/occasions", {
    cache: "force-cache",
    next: { revalidate: 300 },
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="text-center">
          <h1 className="font-heading text-4xl text-brand-heading sm:text-5xl">What are you planning?</h1>
          <p className="mt-3 text-lg text-muted-foreground">Pick an occasion to start your invitation.</p>
        </header>

        {!result.ok ? (
          <EmptyState title="We couldn't load the occasions">
            <span role="alert">{result.message}</span>
          </EmptyState>
        ) : result.data.occasions.length === 0 ? (
          <EmptyState title="No occasions yet">No occasions are available right now. Please check back soon.</EmptyState>
        ) : (
          <OccasionCoverflow occasions={result.data.occasions} />
        )}
      </main>
      <SiteFooter />
      <Analytics />
    </>
  );
}
