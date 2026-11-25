import type { Metadata } from "next";
import Link from "next/link";

import { Analytics } from "@/components/analytics";
import { AppShell } from "@/components/app-shell/app-shell";
import { EmptyState } from "@/components/brand/empty-state";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";
import type { OccasionsResponse, TemplatesResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/session";

import { DesignGallery } from "./design-gallery";

export const metadata: Metadata = {
  title: "Browse invitation designs",
  description:
    "Explore every invitation design, filter by occasion, preview it up close and start your free online invite from the one you love.",
  alternates: { canonical: "/designs" },
};

/**
 * Design gallery. Works for signed-in and anonymous visitors alike; picking a design
 * continues into `/create/<occasion>?template=<slug>`. Signed-in users get it inside the app shell (so the
 * navigation rail stays); visitors get the public header and footer. The catalog is public and rarely changes,
 * so both fetches are cached for 5 min like the create pages.
 */
export default async function DesignsPage() {
  const [occasionsResult, templatesResult, user] = await Promise.all([
    serverApi<OccasionsResponse>("/v1/occasions", { cache: "force-cache", next: { revalidate: 300 } }),
    serverApi<TemplatesResponse>("/v1/templates", { cache: "force-cache", next: { revalidate: 300 } }),
    getCurrentUser(),
  ]);

  const content = (
    <>
      <header className="text-center">
        <h1 className="font-heading text-3xl text-brand-heading sm:text-4xl">Browse invitation designs</h1>
        <p className="mx-auto mt-2 max-w-xl text-base text-muted-foreground sm:text-lg">
          Find a look you love, then make it yours. Every design is free to try.
        </p>
      </header>

      {!occasionsResult.ok ? (
        <LoadError message={occasionsResult.message} />
      ) : !templatesResult.ok ? (
        <LoadError message={templatesResult.message} />
      ) : templatesResult.data.templates.length === 0 ? (
        <EmptyState title="No designs yet">New designs are on their way. Please check back soon.</EmptyState>
      ) : (
        <DesignGallery templates={templatesResult.data.templates} occasions={occasionsResult.data.occasions} />
      )}
    </>
  );

  if (user) return <AppShell>{content}</AppShell>;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">{content}</main>
      <SiteFooter />
      <Analytics />
    </>
  );
}

function LoadError({ message }: { message: string }) {
  return (
    <EmptyState
      title="We couldn't load the designs"
      action={
        <Button variant="outline" render={<Link href="/create" />} nativeButton={false}>
          Start from an occasion
        </Button>
      }
    >
      <span role="alert">{message}</span>
    </EmptyState>
  );
}
