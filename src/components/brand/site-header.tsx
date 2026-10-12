import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { Logo } from "./logo";

/**
 * Header for public, non-invite pages. The invite pages keep their own chrome.
 * `links` are optional in-page section links, shown from the md breakpoint up.
 */
export function SiteHeader({ links }: { links?: ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <Link href="/" aria-label="See You There, home" className="rounded-md text-brand-heading">
        <Logo title="" className="h-6 sm:h-8" />
      </Link>
      {links ? (
        <nav aria-label="Sections" className="mr-auto ml-2 hidden items-center gap-1 md:flex">
          {links}
        </nav>
      ) : null}
      <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="sm" render={<Link href="/login" />} nativeButton={false}>
          Log in
        </Button>
        <Button size="sm" render={<Link href="/create" />} nativeButton={false}>
          Create an event
        </Button>
      </nav>
    </header>
  );
}
