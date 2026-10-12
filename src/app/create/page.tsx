import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/brand/empty-state";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import type { OccasionsResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

export const metadata: Metadata = { title: "Create an event" };

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
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
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
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.occasions.map((occasion) => (
              <li key={occasion.slug}>
                <Link
                  href={`/create/${occasion.slug}`}
                  className="group grid h-full content-start gap-2 rounded-[28px] bg-card p-6 shadow-sm ring-1 ring-border outline-none transition-[box-shadow,transform] duration-(--duration-fast) hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  <span aria-hidden className="mb-2 block h-1 w-8 rounded-full bg-brand-brass" />
                  <span className="font-heading text-2xl text-brand-heading">{occasion.name}</span>
                  {occasion.copy.tagline && (
                    <span className="text-muted-foreground">{occasion.copy.tagline}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
