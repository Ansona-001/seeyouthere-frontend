import type { Metadata } from "next";
import Link from "next/link";

import { Analytics } from "@/components/analytics";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Host an event",
  description: "Build a website for your event with a programme and registration, then check guests in at the door.",
  alternates: { canonical: "/host" },
};

const STEPS = [
  { title: "Build your event website", body: "Add the about text, programme, venue and speakers as sections you can edit and reorder." },
  {
    title: "Share one link",
    body: "Guests register on your site, and we email each one a confirmation.",
  },
  { title: "Optional entry passes", body: "Turn on QR entry passes if you want them. Guests see theirs on the event page once they register." },
  { title: "Check guests in", body: "Open Check-in on your phone, scan passes or search the list, and see who has arrived." },
] as const;

/** Entry point for hosts who want an event website with registration and door check-in. */
export default function HostPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
        <header>
          <h1 className="font-heading text-3xl text-brand-heading sm:text-5xl">Host an event</h1>
          <p className="mt-3 max-w-[48ch] text-base text-muted-foreground sm:text-lg">
            Give your conference, concert or gala its own website, take registrations, and check guests in at the door.
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
          <Button size="lg" render={<Link href="/create/event" />} nativeButton={false}>
            Host an event
          </Button>
        </div>
      </main>
      <SiteFooter />
      <Analytics />
    </>
  );
}
