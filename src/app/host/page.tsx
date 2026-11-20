import type { Metadata } from "next";
import Link from "next/link";

import { Analytics } from "@/components/analytics";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Host an event",
  description: "Register your event, invite guests, give each one an entry pass and scan them in at the door.",
  alternates: { canonical: "/host" },
};

const STEPS = [
  { title: "Register your event", body: "Design the stage event page your guests will see." },
  {
    title: "Share one link",
    body: "Guests register, and we email each one their entry pass.",
  },
  { title: "They get an entry pass", body: "Guests see a QR pass on the event page once they say they’re coming." },
  { title: "Scan at the door", body: "Open Check-in on your phone, scan passes and see who has arrived." },
] as const;

/** Entry point for hosts who want entry passes and door check-in. Hosting is limited to the "On stage" occasion. */
export default function HostPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <header>
          <h1 className="font-heading text-3xl text-brand-heading sm:text-5xl">Host an event</h1>
          <p className="mt-3 max-w-[48ch] text-base text-muted-foreground sm:text-lg">
            Run the door as well as the invitation. Each guest gets an entry pass, and you check them in by scanning
            it. Hosting is for stage events.
          </p>
        </header>

        <ol className="grid gap-3 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
              >
                {i + 1}
              </span>
              <div>
                <h2 className="font-heading text-lg text-brand-heading">{step.title}</h2>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div>
          <Button size="lg" render={<Link href="/create/function?kind=hosted" />} nativeButton={false}>
            Host a stage event
          </Button>
        </div>
      </main>
      <SiteFooter />
      <Analytics />
    </>
  );
}
