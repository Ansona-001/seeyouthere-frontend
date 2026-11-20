import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

import { LoginDialog } from "./login-dialog";
import { Logo } from "./logo";

// The lockup's wordmark sits on the doorway's base, ~17% of the logo height below the SVG's centre, so the
// nav is nudged down (17% of h-6 / h-8) to share the wordmark's text line instead of the box's centre.
const TEXT_LINE = "translate-y-1 sm:translate-y-[5px]";

const NAV_LINK =
  "inline-flex h-11 items-center rounded-full px-3 text-sm font-semibold text-foreground transition-colors duration-(--duration-fast) outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none";

// Hash links go through `/` so they also work from other pages; on the landing page they scroll in place.
const LINKS = [
  { href: "/#designs", label: "Designs" },
  { href: "/#how", label: "How it works" },
  { href: "/#host", label: "Host an event" },
  { href: "/help", label: "Help" },
] as const;

/**
 * Header for public, non-invite pages (the invite pages keep their own chrome): logo on the left, the site links
 * centred from the md breakpoint up, and one account button on the right (Dashboard when signed in, otherwise Log in). Below md
 * only the logo and the button show; the same links are in the footer and on the pages they lead to.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
      <Link href="/" aria-label="See You There, home" className="w-fit rounded-md text-brand-heading">
        <Logo title="" className="h-6 sm:h-8" />
      </Link>
      <nav aria-label="Main" className={`hidden items-center gap-1 md:flex ${TEXT_LINE}`}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={NAV_LINK}>
            {l.label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Account" className={`flex items-center justify-self-end ${TEXT_LINE}`}>
        {user ? (
          <Button size="sm" render={<Link href="/app" />} nativeButton={false}>
            Dashboard
          </Button>
        ) : (
          <LoginDialog />
        )}
      </nav>
    </header>
  );
}
