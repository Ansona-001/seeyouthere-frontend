import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";

export const metadata: Metadata = {
  title: "Help and contact",
  description: "Answers to common questions about creating, publishing and sharing your invitation, and how to reach us.",
};

type Topic = { title: string; items: { q: string; a: React.ReactNode }[] };

const linkClass = "font-medium underline underline-offset-4 decoration-brand-brass-ink hover:text-foreground";

const TOPICS: Topic[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "How do I create an invitation?",
        a: (
          <>
            Choose an occasion on the <Link href="/create" className={linkClass}>create page</Link>, answer a few quick questions
            (the date, time and venue are required), then pick a look. You can change the wording, sections and design afterwards in the
            editor.
          </>
        ),
      },
      {
        q: "Do my guests need an account?",
        a: "No. Guests open your link and reply to the invitation without signing up. You only need to log in to create and manage events.",
      },
      {
        q: "How do I log in?",
        a: "Enter your email on the log-in page and we'll send you a sign-in code. Check your spam folder if it doesn't arrive within a minute or two.",
      },
    ],
  },
  {
    title: "Editing and publishing",
    items: [
      {
        q: "Are my changes saved automatically?",
        a: "Drafts save automatically a moment after you stop typing; once an event is published, press Save changes. If a section can't be saved, it is marked “Needs attention” with the problem shown under the field.",
      },
      {
        q: "Why can't I publish yet?",
        a: "Publishing needs a link, a title and a date and time. The Settings panel in the editor lists whatever is still missing.",
      },
      {
        q: "Can I change my invitation link after publishing?",
        a: "No. Choose the link carefully before you publish. If you need a different one, create a new event.",
      },
      {
        q: "How do I take my invitation offline?",
        a: "Open the event in the editor and choose Unpublish in Settings. Guests can no longer open it until you publish again.",
      },
    ],
  },
  {
    title: "Guests and replies",
    items: [
      {
        q: "Where can I see who has replied?",
        a: (
          <>
            Open your event from <Link href="/app" className={linkClass}>your events</Link> to see replies and manage your guest list.
          </>
        ),
      },
    ],
  },
  {
    title: "Your account",
    items: [
      {
        q: "How do I delete my account?",
        a: (
          <>
            Go to <Link href="/account" className={linkClass}>Account</Link> and choose delete account. This removes your account and cannot be
            undone.
          </>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-12 sm:py-16">
        <header>
          <h1 className="font-heading text-4xl text-brand-heading sm:text-5xl">Help and contact</h1>
          <p className="mt-2 text-muted-foreground">Quick answers below. If you can&rsquo;t find yours, email us and a person will reply.</p>
        </header>

        {TOPICS.map((topic, ti) => (
          <section key={topic.title} aria-labelledby={`topic-${ti}`}>
            <h2 id={`topic-${ti}`} className="font-heading text-2xl text-brand-heading">
              {topic.title}
            </h2>
            <div className="mt-3 divide-y rounded-2xl bg-card ring-1 ring-border">
              {topic.items.map((item) => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span aria-hidden="true" className="text-muted-foreground transition-transform duration-(--duration-fast) group-open:rotate-45 motion-reduce:transition-none">
                      +
                    </span>
                  </summary>
                  <p className="pt-1 pb-2 text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section id="contact" aria-labelledby="contact-title" className="scroll-mt-4 rounded-2xl bg-card p-6 ring-1 ring-border sm:p-8">
          <h2 id="contact-title" className="font-heading text-2xl text-brand-heading">
            Contact us
          </h2>
          <p className="mt-2 text-muted-foreground">
            Questions, problems or feedback &mdash; we read every message. Include your event&rsquo;s link if it&rsquo;s about a specific
            invitation, and never send a password or sign-in code.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button render={<a href={SUPPORT_MAILTO} />} nativeButton={false}>
              Email us
            </Button>
            <span className="text-sm text-muted-foreground">{SUPPORT_EMAIL}</span>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
