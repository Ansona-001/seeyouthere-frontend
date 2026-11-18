import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { Analytics } from "@/components/analytics";
import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { JsonLd } from "@/components/json-ld";
import { Button } from "@/components/ui/button";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

import { LandingEffects } from "./landing-effects";
import { LandingHero } from "./landing-hero";

// Mirrors the occasion catalog seeded in the API (slug -> /create/[slug]).
// Kept static so the landing page needs no API round-trip.
// Card art: real renders of our themes, cropped and pre-optimised in public/landing.
// `tile` is the grid footprint: weddings take a 2x2 block, the wide ones two columns from md up, and
// parties always two so the last row is never left with a gap. `delay` staggers the scroll reveal.
const OCCASIONS = [
  {
    slug: "wedding",
    name: "Weddings",
    caption: "Invites and save the dates",
    tile: "col-span-2 row-span-2",
    delay: "",
  },
  {
    slug: "birthday",
    name: "Birthdays",
    caption: "From first to fiftieth",
    tile: "md:col-span-2",
    delay: "[--d:1]",
  },
  {
    slug: "baby-shower",
    name: "Baby showers",
    caption: null,
    tile: "",
    delay: "[--d:2]",
  },
  // Soft hyphen: the word may break in the narrow tile, and only there.
  {
    slug: "housewarming",
    name: "House­warmings",
    caption: null,
    tile: "",
    delay: "[--d:3]",
  },
  {
    slug: "engagement",
    name: "Engagements",
    caption: "Tell everyone, properly",
    tile: "md:col-span-2",
    delay: "[--d:1]",
  },
  {
    slug: "party",
    name: "Parties",
    caption: "Milestones and late nights",
    tile: "col-span-2",
    delay: "[--d:2]",
  },
] as const;

// The "Pick an occasion" illustration: a small, self-running copy of the cover-flow picker on /create.
// `pose` is where each card rests (and stays, under reduced motion). `step` is how far round the loop it
// starts, so the shared lp-flow animation brings each card to the front in turn.
const FLOW_SECONDS = 15; // must match the 15s in the lp-flow / lp-flow-label classes below
const SIDE = "translate(-50%,-50%)";
const FAN = [
  { slug: "birthday", name: "Birthday", step: 0, pose: `z-10 [transform:${SIDE}]` },
  {
    slug: "engagement",
    name: "Engagement",
    step: 1,
    pose: `z-9 [transform:${SIDE}_translateX(-70%)_rotateY(55deg)_scale(0.86)]`,
  },
  {
    slug: "wedding",
    name: "Wedding",
    step: 2,
    pose: `z-8 [transform:${SIDE}_translateX(-100%)_rotateY(55deg)_scale(0.86)]`,
  },
  { slug: "party", name: "Party", step: 3, pose: `opacity-0 [transform:${SIDE}_scale(0.86)]` },
  {
    slug: "housewarming",
    name: "Housewarming",
    step: 4,
    pose: `z-8 [transform:${SIDE}_translateX(100%)_rotateY(-55deg)_scale(0.86)]`,
  },
  {
    slug: "baby-shower",
    name: "Baby shower",
    step: 5,
    pose: `z-9 [transform:${SIDE}_translateX(70%)_rotateY(-55deg)_scale(0.86)]`,
  },
] as const;
const flowDelay = (step: number): CSSProperties => ({ animationDelay: `${(-step * FLOW_SECONDS) / 6}s` });

// Sample details for the "How it works" illustrations. They match the wedding card's names and date.
const DETAILS = [
  { label: "Who", value: "Maya and Daniel" },
  { label: "When", value: "Sat 7 Nov, 4 pm" },
  { label: "Where", value: "Elm Row Gardens" },
  { label: "Reply by", value: "20 October" },
  { label: "Dress code", value: "Garden party" },
] as const;

// Sits on the hero's occasion colour: `text-foreground`, `bg-accent` and `ring` resolve to that
// occasion's pair there (see .landing-hero in globals.css).
const navLink =
  "inline-flex h-11 items-center rounded-full px-3 text-sm font-semibold text-foreground transition-colors duration-(--duration-fast) outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none";

const sectionTitle =
  "font-heading text-[clamp(2.3rem,5.5vw,4.25rem)] leading-[0.98] font-extrabold tracking-[-0.035em]";

function CardArt({ slug, className, style }: { slug: string; className: string; style?: CSSProperties }) {
  return (
    <Image
      src={`/landing/card-${slug}.webp`}
      alt=""
      width={390}
      height={520}
      // Already cropped and compressed; the site's custom loader only serves media renditions.
      unoptimized
      className={className}
      style={style}
    />
  );
}

function Step({
  title,
  body,
  delay,
  children,
}: {
  title: string;
  body: string;
  delay: string;
  children: React.ReactNode;
}) {
  return (
    <li
      data-reveal
      className={`flex flex-col rounded-[1.6rem] border-[1.5px] border-border bg-card p-6 before:block before:font-heading before:text-[5.5rem] before:leading-[0.8] before:font-extrabold before:text-card before:content-[counter(step)] before:[-webkit-text-stroke:3px_var(--foreground)] before:[paint-order:stroke_fill] [counter-increment:step] ${delay}`}
    >
      <h3 className="mt-5 font-heading text-3xl">{title}</h3>
      <p className="mt-2.5 max-w-md text-[1.0625rem] text-muted-foreground">{body}</p>
      {/* Takes the height left in the card, so the three cards finish level with nothing empty below. */}
      <div aria-hidden className="mt-6 flex flex-1 flex-col gap-2.5 rounded-[1.125rem] bg-muted p-4">
        {children}
      </div>
    </li>
  );
}

export const metadata: Metadata = {
  title: { absolute: `${SITE_NAME}: free online invitations and RSVPs` },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: siteUrl().origin,
          description: SITE_DESCRIPTION,
        }}
      />
      {/* The header and the hero share one colour pair, set here for the first paint and updated by
          LandingHero as the occasion changes. Kept as a plain attribute on a server-rendered element so
          only the hero itself re-renders. */}
      <div data-landing-top data-occasion="wedding" className="flex flex-1 flex-col">
        <div className="landing-hero">
          <SiteHeader
            links={
              <>
                <a href="#designs" className={navLink}>
                  Designs
                </a>
                <a href="#how" className={navLink}>
                  How it works
                </a>
                <Link href="/help" className={navLink}>
                  Help
                </Link>
              </>
            }
          />
        </div>
        <main className="flex flex-1 flex-col">
          <LandingHero />
          <section
            id="designs"
            className="mx-auto flex min-h-svh w-full max-w-6xl scroll-mt-0 flex-col justify-center px-4 py-14 sm:px-6"
            aria-labelledby="occasions-title"
          >
            <div data-reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <h2 id="occasions-title" className={sectionTitle}>
                What do you want to send?
              </h2>
              <p className="max-w-sm text-lg text-muted-foreground">Pick an occasion to start your invitation.</p>
            </div>
            {/* Uneven grid of colour tiles, one per occasion. On hover the card straightens, lifts and
              leans toward the pointer (LandingEffects feeds --rx / --ry). */}
            <ul className="mt-8 grid auto-rows-[13rem] grid-cols-2 gap-3.5 md:auto-rows-[14.5rem] md:grid-cols-4">
              {OCCASIONS.map((o) => {
                const big = o.slug === "wedding";
                return (
                  <li key={o.slug} data-reveal className={`${o.tile} ${o.delay}`}>
                    <Link
                      href={`/create/${o.slug}`}
                      data-occasion={o.slug}
                      data-tilt
                      className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] bg-(--ground) p-5 text-(--on) outline-offset-3 [perspective:700px] focus-visible:outline-(--foreground)"
                    >
                      <h3
                        className={`relative z-1 font-heading hyphens-manual ${
                          big
                            ? "text-[clamp(2.2rem,5vw,4rem)] leading-none"
                            : "text-[clamp(1.5rem,2.6vw,2.25rem)] leading-none"
                        }`}
                      >
                        {o.name}
                      </h3>
                      {o.caption ? (
                        <span className="relative z-1 mt-1.5 max-w-44 text-[0.9375rem] font-medium">{o.caption}</span>
                      ) : null}
                      <span
                        aria-hidden
                        className="relative z-1 mt-auto grid size-11 place-items-center rounded-full bg-(--on) text-(--ground) transition-transform duration-(--duration-slow) ease-(--ease-spring) group-hover:translate-x-1.5 group-hover:-rotate-45 motion-reduce:transition-none"
                      >
                        <ArrowRightIcon className="size-5" />
                      </span>
                      <CardArt
                        slug={o.slug}
                        className={`absolute h-auto rounded-lg shadow-[0_16px_28px_-12px_rgb(0_0_0/0.5)] transition-[transform,bottom] duration-[450ms] ease-(--ease-spring) [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_rotate(8deg)] group-hover:[transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))_rotate(0deg)_scale(1.04)] group-focus-visible:[transform:rotate(0deg)_scale(1.04)] motion-reduce:transition-none ${
                          big
                            ? "right-[7%] -bottom-[8%] w-[46%] group-hover:bottom-0 group-focus-visible:bottom-0"
                            : "right-[8%] -bottom-[16%] w-[44%] group-hover:-bottom-[6%] group-focus-visible:-bottom-[6%]"
                        }`}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section
            id="how"
            className="mx-auto flex min-h-svh w-full max-w-6xl scroll-mt-0 flex-col justify-center px-4 py-14 sm:px-6"
            aria-labelledby="how-title"
          >
            <h2 id="how-title" data-reveal className={sectionTitle}>
              How it works
            </h2>
            <ol className="mt-9 grid gap-3.5 [counter-reset:step] lg:grid-cols-3">
              <Step title="Pick an occasion" body="Choose what you’re celebrating and a design you like." delay="">
                {/* The cover-flow picker from /create in miniature, turning on its own. */}
                <div className="mx-auto my-auto w-full max-w-72">
                  <div className="relative h-44 [perspective:700px]">
                    {FAN.map((c) => (
                      <CardArt
                        key={c.slug}
                        slug={c.slug}
                        style={flowDelay(c.step)}
                        className={`absolute top-1/2 left-1/2 h-auto w-[38%] rounded-lg shadow-md ring-1 ring-foreground/10 motion-safe:animate-[lp-flow_15s_var(--ease-in-out)_infinite] ${c.pose}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="grid size-9 place-items-center rounded-full border border-input bg-card">
                      <ChevronLeftIcon className="size-4" />
                    </span>
                    <span className="relative h-7 flex-1 text-center font-heading text-xl">
                      {FAN.map((c) => (
                        <span
                          key={c.slug}
                          style={flowDelay(c.step)}
                          className={`absolute inset-0 motion-safe:animate-[lp-flow-label_15s_linear_infinite] ${c.step === 0 ? "" : "opacity-0"}`}
                        >
                          {c.name}
                        </span>
                      ))}
                    </span>
                    <span className="grid size-9 place-items-center rounded-full border border-input bg-card">
                      <ChevronRightIcon className="size-4" />
                    </span>
                  </div>
                </div>
              </Step>
              <Step
                title="Fill in the details"
                body="Add the names, date and place, then adjust the colours and wording in the editor."
                delay="[--d:1]"
              >
                <dl className="grid flex-1 auto-rows-fr grid-cols-[minmax(0,1fr)] gap-1.5">
                  {DETAILS.map((d, i) => (
                    <div
                      key={d.label}
                      className="flex items-center gap-3 rounded-xl bg-card px-3.5 py-2.5 font-semibold"
                    >
                      <dt className="w-[5.25rem] shrink-0 whitespace-nowrap font-medium text-muted-foreground">
                        {d.label}
                      </dt>
                      <dd className="min-w-0 truncate">
                        {d.value}
                        {/* A caret on the field being typed. */}
                        {i === DETAILS.length - 1 ? (
                          <span className="ml-0.5 inline-block h-[1.1em] w-0.5 bg-foreground align-[-0.18em] motion-safe:animate-[lp-blink_1.1s_steps(1)_infinite]" />
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Step>
              <Step
                title="Share one link"
                body="Send the link to your guests and see their replies as they arrive."
                delay="[--d:2]"
              >
                <div className="grid gap-2.5 rounded-[0.875rem] bg-card p-3 font-semibold">
                  <span className="truncate px-1">seeyouthere.at/maya-and-daniel</span>
                  <span className="grid h-10 place-items-center rounded-full bg-primary text-primary-foreground">
                    Copy link
                  </span>
                </div>
                {/* What a guest sees when the link arrives in a message. */}
                <div className="flex flex-1 items-center gap-3.5 rounded-[0.875rem] bg-card p-3">
                  <CardArt slug="wedding" className="aspect-3/4 h-auto w-21 shrink-0 rounded-md object-cover" />
                  <div>
                    <span className="block text-[1.0625rem] leading-tight font-semibold">
                      You’re invited: Maya and Daniel
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">Sat 7 November, 4 pm</span>
                    <span className="mt-1 block text-sm text-muted-foreground">seeyouthere.at</span>
                  </div>
                </div>
              </Step>
            </ol>
          </section>
        </main>
      </div>

      {/* Closing: the logo's doorway, drawn large, on the same dark field as the footer below it. */}
      <div className="mt-14 rounded-t-[2.25rem] bg-brand-field text-brand-on-forest sm:mt-20">
        <section
          className="mx-auto grid min-h-[75svh] w-full max-w-6xl items-center gap-8 px-4 pt-16 pb-10 sm:px-6 sm:pt-20 md:grid-cols-[minmax(0,1fr)_18.75rem]"
          aria-labelledby="cta-title"
        >
          <div data-reveal>
            <h2
              id="cta-title"
              className="font-heading text-[clamp(3rem,8.5vw,6.5rem)] leading-[0.98] font-extrabold tracking-[-0.035em]"
            >
              Ready when you are
            </h2>
            <p className="mt-4 text-xl text-brand-on-forest-muted">Pick an occasion and start your invitation.</p>
            <Button
              size="lg"
              className="mt-7 bg-brand-brass-bright text-brand-forest shadow-none hover:bg-brand-on-forest focus-visible:outline-brand-on-forest"
              render={<Link href="/create" />}
              nativeButton={false}
            >
              Create an invite
            </Button>
          </div>
          <svg
            data-reveal
            viewBox="8 8 48 52"
            aria-hidden
            className="landing-door mx-auto block w-full max-w-[18.75rem] overflow-visible"
          >
            <path
              pathLength={1}
              d="M15 57V31a17 17 0 0 1 34 0v26"
              fill="none"
              stroke="currentColor"
              strokeWidth="6.5"
            />
            <circle cx="32" cy="45.5" r="5.33" className="fill-brand-brass-bright" />
          </svg>
        </section>
        <SiteFooter flush />
      </div>
      <Analytics />
      <LandingEffects />
    </>
  );
}
