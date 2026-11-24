import type { Metadata } from "next";
import Link from "next/link";

import { Analytics } from "@/components/analytics";
import { EmptyState } from "@/components/brand/empty-state";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";
import type { OccasionsResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { OccasionCoverflow } from "./occasion-coverflow";

export const metadata: Metadata = {
  title: "Create an invite",
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
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <header className="text-center">
          <h1 className="font-heading text-3xl text-brand-heading sm:text-4xl">What are you planning?</h1>
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">Pick an occasion to start your invitation.</p>
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

        <p className="text-center text-sm text-muted-foreground">
          Want to see the looks first?{" "}
          <Link href="/designs" className="font-medium text-brand-heading underline underline-offset-4 decoration-brand-brass-bright">
            Browse all designs
          </Link>
        </p>

        <aside
          aria-labelledby="host-cta-title"
          className="mx-auto mt-2 flex w-full max-w-2xl flex-col items-center gap-3 rounded-2xl bg-card p-5 text-center ring-1 ring-border sm:flex-row sm:text-left"
        >
          <div className="flex-1">
            <h2 id="host-cta-title" className="font-heading text-xl text-brand-heading">
              Running a conference, concert or gala?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Host an event instead: a full website with a programme, registration and door check-in. It&rsquo;s
              separate from invitations.
            </p>
          </div>
          <Button variant="outline" render={<Link href="/create/event" />} nativeButton={false}>
            Host an event
          </Button>
        </aside>
      </main>
      <SiteFooter />
      <Analytics />
    </>
  );
}
