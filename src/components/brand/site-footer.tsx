import Link from "next/link";

import { getCurrentUser } from "@/lib/session";

import { Logo } from "./logo";

/**
 * Forest footer for public, non-invite pages. Signed-in visitors get an Account link instead of
 * Log in; pages that already know the user can pass `signedIn` to skip the lookup (it is cached
 * per request either way). `flush` is for pages that already end on the dark field (the landing
 * page): the box drops its own inset and rounding so the logo and links line up with the content
 * above, separated from it by a hairline.
 */
export async function SiteFooter({ signedIn, flush = false }: { signedIn?: boolean; flush?: boolean }) {
  const isSignedIn = signedIn ?? (await getCurrentUser()) !== null;
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6 sm:pb-6">
      <div
        className={`flex flex-col gap-6 bg-brand-field py-8 text-brand-on-forest [--logo-dot:var(--brand-brass-bright)] sm:flex-row sm:items-center sm:justify-between ${
          flush ? "border-t border-brand-on-forest/20" : "rounded-2xl px-6 sm:px-8"
        }`}
      >
        <Link href="/" aria-label="See You There, home" className="w-fit rounded-md">
          <Logo title="" className="h-7" />
        </Link>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
            <li>
              <Link href="/create" className="underline-offset-4 decoration-brand-brass-bright hover:underline">
                Create an invite
              </Link>
            </li>
            <li>
              <Link href="/create/event" className="underline-offset-4 decoration-brand-brass-bright hover:underline">
                Host an event
              </Link>
            </li>
            <li>
              <Link href="/help" className="underline-offset-4 decoration-brand-brass-bright hover:underline">
                Help
              </Link>
            </li>
            <li>
              <Link href="/help#contact" className="underline-offset-4 decoration-brand-brass-bright hover:underline">
                Contact us
              </Link>
            </li>
            <li>
              {isSignedIn ? (
                <Link href="/account" className="underline-offset-4 decoration-brand-brass-bright hover:underline">
                  Account
                </Link>
              ) : (
                <Link href="/login" className="underline-offset-4 decoration-brand-brass-bright hover:underline">
                  Log in
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
