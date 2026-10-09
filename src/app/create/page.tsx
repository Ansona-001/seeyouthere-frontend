import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
        <header className="text-center">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">What are you planning?</h1>
          <p className="mt-2 text-muted-foreground">Pick an occasion to start your invitation.</p>
        </header>

        {!result.ok ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {result.message}
          </p>
        ) : result.data.occasions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No occasions are available right now.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {result.data.occasions.map((occasion) => (
              <Link key={occasion.slug} href={`/create/${occasion.slug}`} className="rounded-xl">
                <Card className="h-full transition-colors hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">{occasion.name}</CardTitle>
                    {occasion.copy.tagline && <CardDescription>{occasion.copy.tagline}</CardDescription>}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </>
  );
}
