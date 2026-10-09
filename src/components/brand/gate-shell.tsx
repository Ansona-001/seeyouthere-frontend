import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./logo";

/**
 * Centred panel for the states that stand in for an invitation (password gate,
 * private, opening a link, errors). Brand chrome only: it never carries an
 * event's theme, so nothing here depends on the event being readable.
 */
export function GateShell({
  title,
  children,
  as: Heading = "h1",
}: {
  title: string;
  children?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 bg-background px-4 py-12">
      <div className="grid w-full max-w-sm justify-items-center gap-4 rounded-3xl bg-card px-6 py-10 text-center shadow-md ring-1 ring-border">
        <Logo variant="mark" title="" className="size-12 text-brand-heading" />
        <Heading className="font-heading text-3xl text-brand-heading">{title}</Heading>
        {children}
      </div>
      <Link
        href="/"
        className="rounded-md px-2 py-2 text-sm text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Made with See You There
      </Link>
    </main>
  );
}
