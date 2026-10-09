import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";

// Mirrors the occasion catalog seeded in the API (slug -> /create/[slug]).
// Kept static so the landing page needs no API round-trip and no client JS.
const OCCASIONS = [
  { slug: "wedding", name: "Wedding", blurb: "Schedule, location, dress code and RSVP on one page." },
  { slug: "engagement", name: "Engagement", blurb: "Share the news and gather your people for the party." },
  { slug: "birthday", name: "Birthday", blurb: "Where, when and who's coming, without the group chat." },
  { slug: "baby-shower", name: "Baby shower", blurb: "Celebrate the little one on the way." },
  { slug: "housewarming", name: "Housewarming", blurb: "Invite friends to come see the new place." },
  { slug: "party", name: "Party", blurb: "Any other gathering, with a title of your own." },
] as const;

const STEPS = [
  { title: "Pick an occasion", body: "Start from a page built for the kind of event you are hosting." },
  { title: "Choose a look", body: "Pick a template, palette and fonts, then fill in your details." },
  { title: "Share one link", body: "Send the link to your guests and see their replies as they arrive." },
] as const;

const linkFocus =
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col gap-16 pb-16 sm:gap-24 sm:pb-24">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6" aria-labelledby="hero-title">
          <div className="relative overflow-hidden rounded-3xl bg-brand-field px-6 py-14 text-brand-on-forest [--logo-dot:var(--brand-brass-bright)] sm:px-12 sm:py-20">
            <Logo
              variant="mark"
              title=""
              className="pointer-events-none absolute -right-6 -bottom-10 size-56 text-brand-on-forest/10 sm:right-8 sm:size-80"
            />
            <div className="relative max-w-2xl">
              <p className="text-sm font-medium tracking-wide text-brand-brass-bright uppercase">
                Invitation pages and RSVPs
              </p>
              <h1
                id="hero-title"
                className="mt-4 font-heading text-5xl leading-[1.05] text-balance sm:text-7xl"
              >
                Invitations worth opening<span className="text-brand-brass-bright">.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-brand-on-forest-muted">
                Design an invitation page for your event, share a single link, and keep track of who is
                coming.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="bg-brand-on-forest text-brand-field shadow-none hover:bg-brand-on-forest/90"
                  render={<Link href="/create" />}
                  nativeButton={false}
                >
                  Create an event
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-brand-on-forest hover:bg-brand-on-forest/10"
                  render={<Link href="/login" />}
                  nativeButton={false}
                >
                  Log in
                </Button>
              </div>
            </div>
          </div>
        </section>

        <nav aria-label="Occasions" className="mx-auto w-full max-w-6xl">
          <ul className="flex snap-x gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-6 [&::-webkit-scrollbar]:hidden">
            {OCCASIONS.map((o) => (
              <li key={o.slug} className="shrink-0 snap-start">
                <Link
                  href={`/create/${o.slug}`}
                  className={`inline-flex h-11 items-center rounded-full border border-input bg-card px-5 text-[0.9375rem] font-medium text-foreground transition-colors duration-(--duration-fast) hover:bg-accent motion-reduce:transition-none ${linkFocus}`}
                >
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6" aria-labelledby="occasions-title">
          <h2 id="occasions-title" className="font-heading text-3xl text-brand-heading sm:text-4xl">
            What do you want to send?
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OCCASIONS.map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/create/${o.slug}`}
                  className={`group grid h-full gap-2 rounded-[28px] bg-card p-6 shadow-sm ring-1 ring-border transition-[box-shadow,transform] duration-(--duration-fast) hover:shadow-md active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 ${linkFocus}`}
                >
                  <span aria-hidden className="mb-2 block h-1 w-8 rounded-full bg-brand-brass" />
                  <span className="font-heading text-2xl text-brand-heading">{o.name}</span>
                  <span className="text-muted-foreground">{o.blurb}</span>
                  <span className="mt-2 text-sm font-medium text-primary underline-offset-4 group-hover:underline">
                    Start this invitation
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-brand-linen py-14 sm:py-20" aria-labelledby="how-title">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 id="how-title" className="font-heading text-3xl text-brand-heading sm:text-4xl">
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid content-start gap-2">
                  <span
                    aria-hidden
                    className="grid size-10 place-items-center rounded-full bg-brand-field font-heading text-lg text-brand-on-forest"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-2 font-heading text-xl text-brand-heading">{s.title}</h3>
                  <p className="text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6" aria-labelledby="cta-title">
          <h2 id="cta-title" className="font-heading text-3xl text-brand-heading sm:text-4xl">
            Ready when you are<span className="text-brand-brass">.</span>
          </h2>
          <p className="mt-3 text-muted-foreground">Pick an occasion and start your invitation.</p>
          <Button size="lg" className="mt-6" render={<Link href="/create" />} nativeButton={false}>
            Create an event
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
