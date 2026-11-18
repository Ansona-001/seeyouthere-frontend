"use client";

import { CheckIcon, MinusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

// One entry per occasion in the catalog (slug -> /create/[slug]). The replies are sample copy for the
// illustration: two guests going, one who can't.
const OCCASIONS = [
  {
    slug: "wedding",
    label: "Wedding",
    cta: "Create a wedding invite",
    replies: ["Priya is going", "Tom and Ada are going", "Rosa can’t make it"],
  },
  {
    slug: "birthday",
    label: "Birthday",
    cta: "Create a birthday invite",
    replies: ["Marcus is going", "The Okafors are going", "Lena can’t make it"],
  },
  {
    slug: "baby-shower",
    label: "Baby shower",
    cta: "Create a baby shower invite",
    replies: ["Aunt June is going", "Mei and Sol are going", "Carla can’t make it"],
  },
  {
    slug: "housewarming",
    label: "Housewarming",
    cta: "Create a housewarming invite",
    replies: ["Next door is going", "Idris is going", "Petra can’t make it"],
  },
  {
    slug: "engagement",
    label: "Engagement",
    cta: "Create an engagement invite",
    replies: ["Nani is going", "Sam’s parents are going", "Jo can’t make it"],
  },
  {
    slug: "party",
    label: "Party",
    cta: "Create a party invite",
    replies: ["Dani is going", "Kofi and Bea are going", "Wren can’t make it"],
  },
] as const;

type Occasion = (typeof OCCASIONS)[number];
type Slug = Occasion["slug"];

const FIRST: Occasion = OCCASIONS[0];
const HEADLINE = ["Invitations", "worth", "opening"] as const;
// How long each occasion stays up while the picker is cycling on its own.
const CYCLE_MS = 4200;
// Time the card takes to sink into the envelope before it is swapped for the next design.
const SWAP_MS = 340;
// Pill shared by the picker's radio labels (md up) and the phone links; `has-checked` / `data-current` mark the
// occasion in the envelope.
const CHIP =
  "inline-flex h-11 shrink-0 cursor-pointer items-center rounded-full px-4 font-semibold ring-[1.5px] ring-(--on)/45 transition-[background-color,color,translate] duration-(--duration-base) ease-(--ease-out) ring-inset hover:-translate-y-0.5 has-checked:bg-(--on) has-checked:text-(--ground) has-checked:ring-0 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-(--on) data-current:bg-(--on) data-current:text-(--ground) data-current:ring-0 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--on) motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const REPLY_POSITION = ["top-[4%] left-0", "top-[40%] right-0", "bottom-[22%] left-[2%]"] as const;

const cardSrc = (slug: Slug) => `/landing/card-${slug}.webp`;
const bySlug = (slug: Slug): Occasion => OCCASIONS.find((o) => o.slug === slug) ?? FIRST;
const after = (slug: Slug): Slug => {
  const next = OCCASIONS[(OCCASIONS.findIndex((o) => o.slug === slug) + 1) % OCCASIONS.length];
  return (next ?? FIRST).slug;
};
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Landing-page hero, painted in the colours of the invitation on show. Picking an occasion re-colours
 * it and the header above, swaps the card in the envelope, lands a new set of replies and points the
 * button at that occasion. The picker cycles on its own until someone touches it, and only while the
 * hero is on screen and motion is allowed.
 *
 * The colours come from `data-occasion` on the nearest `[data-landing-top]` ancestor, which the page
 * renders around the header and <main>; this component only updates that attribute.
 */
export function LandingHero() {
  const [selected, setSelected] = useState<Slug>(FIRST.slug);
  // The design in the envelope. It trails `selected` by SWAP_MS so the card changes while out of sight.
  const [shown, setShown] = useState<Slug>(FIRST.slug);
  const [auto, setAuto] = useState(true);
  // False until the card's load animation has ended (or a swap has replaced it); transitions take over then.
  const [settled, setSettled] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);

  const swapping = shown !== selected;
  const occasion = bySlug(selected);
  const inEnvelope = bySlug(shown);

  useEffect(() => {
    const top = sectionRef.current?.closest<HTMLElement>("[data-landing-top]");
    if (top) top.dataset.occasion = selected;
  }, [selected]);

  useEffect(() => {
    // Phones: slide the lit pill to the middle of the row while the picker cycles. Scrolls the row only, never
    // the page; skipped once someone has touched the row so it never pulls against their swipe.
    const row = rowRef.current;
    if (!auto || !row || row.clientWidth === 0) return;
    const pill = row.children[OCCASIONS.findIndex((o) => o.slug === selected)];
    if (!(pill instanceof HTMLElement)) return;
    row.scrollTo({
      left: pill.offsetLeft - (row.clientWidth - pill.offsetWidth) / 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [selected, auto]);

  useEffect(() => {
    // Warm the cache so a swap never shows an empty card.
    for (const o of OCCASIONS) {
      if (o.slug !== FIRST.slug) new window.Image().src = cardSrc(o.slug);
    }
  }, []);

  useEffect(() => {
    if (shown === selected) return;
    const timer = window.setTimeout(() => {
      setShown(selected);
      setSettled(true);
    }, SWAP_MS);
    return () => window.clearTimeout(timer);
  }, [selected, shown]);

  useEffect(() => {
    if (!auto) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stage = stageRef.current;
    let visible = true;
    let timer = 0;
    const sync = () => {
      window.clearInterval(timer);
      if (visible && !document.hidden && !reduce.matches) {
        timer = window.setInterval(() => setSelected(after), CYCLE_MS);
      }
    };
    const observer =
      stage && "IntersectionObserver" in window
        ? new IntersectionObserver((entries) => {
            const entry = entries[entries.length - 1];
            if (!entry) return;
            visible = entry.isIntersecting;
            sync();
          })
        : null;
    if (observer && stage) observer.observe(stage);
    else sync();
    document.addEventListener("visibilitychange", sync);
    reduce.addEventListener("change", sync);
    return () => {
      window.clearInterval(timer);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduce.removeEventListener("change", sync);
    };
  }, [auto]);

  function choose(slug: Slug) {
    setAuto(false);
    setSelected(slug);
    // Without motion there is nothing to wait for: show the new design straight away.
    if (prefersReducedMotion()) setShown(slug);
  }

  // Exactly one transform at a time: the load animation, the sink, or the resting pose.
  const cardMotion = swapping
    ? "motion-safe:[transform:translateY(76%)_rotate(0deg)] motion-safe:transition-transform motion-safe:duration-[320ms] motion-safe:ease-[cubic-bezier(0.5,0,0.9,0.4)] motion-reduce:[transform:translateY(-24%)_rotate(-3deg)]"
    : `[transform:translateY(-24%)_rotate(-3deg)] motion-safe:transition-transform motion-safe:duration-[750ms] motion-safe:ease-(--ease-spring) ${
        settled ? "" : "motion-safe:animate-[lp-deal_0.9s_var(--ease-spring)_800ms_both]"
      }`;

  return (
    // Header (~5.5rem) + hero fill exactly one screen, so the envelope is in view without scrolling.
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="landing-hero flex min-h-[calc(100svh-5.5rem)] flex-col justify-center overflow-hidden rounded-b-[2.25rem]"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-4 px-4 py-5 sm:px-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:content-center md:gap-x-7 md:gap-y-0 md:py-8">
        <div className="md:col-start-1 md:row-start-1 md:self-end">
          <h1
            id="hero-title"
            className="font-heading text-[clamp(2.4rem,min(9.5vw,13svh),7.25rem)] leading-[0.98] font-extrabold"
          >
            <span className="sr-only">{HEADLINE.join(" ")}</span>
            {/* Each word rises out of its own clipped line once, on load. */}
            {HEADLINE.map((word, i) => (
              <span key={word} aria-hidden>
                <span className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom">
                  <span
                    className="inline-block motion-safe:animate-[lp-rise_0.9s_var(--ease-out)_both]"
                    style={{ animationDelay: `${i * 90 + 100}ms` }}
                  >
                    {word}
                  </span>
                </span>{" "}
              </span>
            ))}
          </h1>
          <p className="mt-3 max-w-[30rem] text-base leading-normal motion-safe:animate-[lp-fade-up_0.8s_var(--ease-out)_420ms_both] sm:mt-5 sm:text-xl">
            Pick a design, add the when and where, and send it by link. Every reply lands in one tidy list.
          </p>
          {/* From md up; on phones each occasion below is itself the way in, which leaves the room to the envelope. */}
          <div className="mt-7 hidden motion-safe:animate-[lp-fade-up_0.8s_var(--ease-out)_520ms_both] md:block">
            <Button size="lg" render={<Link href={`/create/${occasion.slug}`} />} nativeButton={false}>
              {occasion.cta}
            </Button>
          </div>
        </div>

        {/* An open envelope handing over the invitation, with replies landing around it. Decorative:
                the picker and the button carry the meaning. */}
        <div
          ref={stageRef}
          aria-hidden
          className="relative mx-auto aspect-[1/1.08] md:col-start-2 md:row-span-2 md:row-start-1 md:self-center h-[min(42svh,27.5rem)] [perspective:900px] md:h-auto md:w-full md:max-w-[27.5rem] motion-safe:animate-[lp-bob_7s_ease-in-out_2.6s_infinite_alternate]"
        >
          {/* Unmounted while the card is away, so each new set pops in from scratch. */}
          {swapping
            ? null
            : inEnvelope.replies.map((reply, i) => (
                <span
                  key={`${inEnvelope.slug}-${i}`}
                  className={`absolute z-4 inline-flex items-center gap-2 rounded-full bg-card py-1.5 pr-3 pl-2 text-[0.8125rem] font-semibold whitespace-nowrap text-card-foreground shadow-md motion-safe:animate-[lp-pop_0.55s_var(--ease-spring)_both] sm:py-2 sm:pr-3.5 sm:pl-2.5 sm:text-[0.9375rem] ${REPLY_POSITION[i] ?? ""}`}
                  style={{
                    animationDelay: settled ? `${i * 220 + 450}ms` : `${i * 260 + 1500}ms`,
                  }}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full ${
                      i < 2 ? "bg-brand-success text-white" : "bg-secondary text-card-foreground"
                    }`}
                  >
                    {i < 2 ? <CheckIcon className="size-3.5" /> : <MinusIcon className="size-3.5" />}
                  </span>
                  {reply}
                </span>
              ))}
          <div className="absolute inset-x-[7%] bottom-[7%] aspect-[3/2] drop-shadow-[0_26px_22px_rgb(0_0_0/0.22)]">
            <div className="absolute inset-0 rounded-[10px] bg-(--envelope-shade)" />
            <div className="absolute inset-x-0 bottom-[calc(100%-1px)] z-1 h-[58%] origin-bottom bg-(--envelope) [clip-path:polygon(0_100%,50%_0,100%_100%)] motion-safe:animate-[lp-flap_0.8s_var(--ease-out)_250ms_both]" />
            {/* Clips the card at the envelope's bottom edge only, so it can sink in and rise out. */}
            <div className="pointer-events-none absolute inset-x-0 -top-[130%] bottom-0 z-2 overflow-hidden">
              <Image
                src={cardSrc(inEnvelope.slug)}
                alt=""
                width={390}
                height={520}
                // Already cropped and compressed; the site's custom loader only serves media renditions.
                unoptimized
                priority
                onAnimationEnd={() => setSettled(true)}
                className={`absolute bottom-[4%] left-[17%] h-auto w-[66%] rounded-[9px] shadow-[0_10px_24px_-8px_rgb(0_0_0/0.45)] ${cardMotion}`}
              />
            </div>
            <div className="absolute inset-0 z-3 rounded-[10px] bg-(--envelope) [clip-path:polygon(0_0,50%_56%,100%_0,100%_100%,0_100%)] after:absolute after:inset-0 after:bg-linear-to-b after:from-transparent after:from-40% after:to-black/10" />
          </div>
        </div>

        <fieldset
          className="mt-8 hidden min-w-0 motion-safe:animate-[lp-fade-up_0.8s_var(--ease-out)_620ms_both] md:col-start-1 md:row-start-2 md:block md:self-start"
          onPointerDown={() => setAuto(false)}
        >
          <legend className="mb-2.5 font-semibold">What are you celebrating?</legend>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <label key={o.slug} className={CHIP}>
                <input
                  type="radio"
                  name="hero-occasion"
                  value={o.slug}
                  checked={selected === o.slug}
                  onChange={() => choose(o.slug)}
                  className="sr-only"
                />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Phones: one swipeable row of links straight to each occasion's editor (no separate button). The pill
            of the design in the envelope is lit, so the cycling still shows which card is which. */}
        <nav
          aria-labelledby="hero-occasions"
          className="min-w-0 motion-safe:animate-[lp-fade-up_0.8s_var(--ease-out)_620ms_both] md:hidden"
        >
          <p id="hero-occasions" className="mb-2 font-semibold">
            What are you celebrating?
          </p>
          {/* `relative` makes the row each pill's offsetParent, so offsetLeft is measured within the row. */}
          <ul
            ref={rowRef}
            onPointerDown={() => setAuto(false)}
            className="relative -mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
          >
            {OCCASIONS.map((o) => (
              <li key={o.slug} className="shrink-0">
                <Link href={`/create/${o.slug}`} data-current={selected === o.slug ? "" : undefined} className={CHIP}>
                  {o.label}
                  <span className="sr-only"> invite</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
