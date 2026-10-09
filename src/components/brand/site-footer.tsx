import Link from "next/link";

import { Logo } from "./logo";

/** Forest footer for public, non-invite pages. */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="flex flex-col gap-6 rounded-2xl bg-brand-field px-6 py-8 text-brand-on-forest [--logo-dot:var(--brand-brass-bright)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" aria-label="See You There, home" className="w-fit rounded-md">
          <Logo title="" className="h-7" />
        </Link>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
            <li>
              <Link href="/create" className="underline-offset-4 decoration-brand-brass-bright hover:underline">
                Create an event
              </Link>
            </li>
            <li>
              <Link href="/login" className="underline-offset-4 decoration-brand-brass-bright hover:underline">
                Log in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
