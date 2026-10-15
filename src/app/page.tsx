import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/brand/site-footer";
import { SiteHeader } from "@/components/brand/site-header";
import { Button } from "@/components/ui/button";

// Mirrors the occasion catalog seeded in the API (slug -> /create/[slug]).
// Kept static so the landing page needs no API round-trip and no client JS.
// Card art: real renders of our themes, cropped and pre-optimised in public/landing.
const OCCASIONS = [
  { slug: "wedding", art: "wedding", name: "Weddings", caption: "Invites and save the dates", backdrop: "backdrop-linen", tilt: "-rotate-3" },
  { slug: "birthday", art: "birthday", name: "Birthdays", caption: "From first to fiftieth", backdrop: "backdrop-confetti", tilt: "rotate-3" },
  { slug: "baby-shower", art: "baby-shower", name: "Baby showers", caption: "Soft, sweet, a little silly", backdrop: "backdrop-watercolour", tilt: "-rotate-2" },
  { slug: "housewarming", art: "housewarming", name: "Housewarmings", caption: "New keys, open doors", backdrop: "backdrop-oak", tilt: "rotate-2" },
  { slug: "engagement", art: "engagement", name: "Engagements", caption: "Tell everyone, properly", backdrop: "backdrop-foil", tilt: "rotate-3" },
  { slug: "party", art: "milestone", name: "Parties", caption: "Milestones and late nights", backdrop: "backdrop-marble", tilt: "-rotate-2" },
] as const;

type IconName = "all" | "wedding" | "engagement" | "birthday" | "baby-shower" | "housewarming" | "party";

const STRIP: readonly { icon: IconName; href: string; label: string }[] = [
  { icon: "all", href: "/create", label: "All designs" },
  { icon: "wedding", href: "/create/wedding", label: "Weddings" },
  { icon: "engagement", href: "/create/engagement", label: "Engagements" },
  { icon: "birthday", href: "/create/birthday", label: "Birthdays" },
  { icon: "baby-shower", href: "/create/baby-shower", label: "Baby showers" },
  { icon: "housewarming", href: "/create/housewarming", label: "Housewarmings" },
  { icon: "party", href: "/create/party", label: "Parties" },
];

const ICON_PATHS: Record<IconName, string> = {
  all: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  wedding: "M9 18a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM15 18a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  engagement: "M12 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM9 4l-2 3 5 2 5-2-2-3z",
  birthday: "M4 20h16M5 20v-6h14v6M5 14c2 0 2-2 3.5-2s2 2 3.5 2 2-2 3.5-2 1.5 2 3.5 2M12 11V7M12 4v1",
  "baby-shower": "M9 3h6M10 3v3h4V3M8 8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM8 13h3M8 17h3",
  housewarming: "M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5",
  party: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z",
};

const STEPS = [
  { title: "Pick an occasion", body: "Answer a couple of questions, then tweak the template, colours and details in the editor." },
  { title: "Share one link", body: "Send the link to your guests and see their replies as they arrive." },
] as const;

const linkFocus =
  "outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const navLink = `inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors duration-(--duration-fast) hover:bg-accent motion-reduce:transition-none ${linkFocus}`;

function CardArt({
  name,
  alt = "",
  className,
  priority = false,
}: {
  name: string;
  alt?: string;
  className: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/landing/card-${name}.webp`}
      alt={alt}
      width={320}
      height={480}
      // Already cropped and compressed; the site's custom loader only serves media renditions.
      unoptimized
      priority={priority}
      className={`absolute rounded-md shadow-xl ring-1 ring-black/10 ${className}`}
    />
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader
        links={
          <>
            <a href="#designs" className={navLink}>
              Designs
            </a>
            <a href="#how" className={navLink}>
              How it works
            </a>
          </>
        }
      />
      <main className="flex flex-1 flex-col gap-14 pb-16 sm:gap-20 sm:pb-24">
        <section
          className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12"
          aria-labelledby="hero-title"
        >
          <div className="pt-4 lg:pt-0">
            <h1
              id="hero-title"
              className="font-heading text-5xl leading-[1.02] text-balance text-brand-heading sm:text-7xl"
            >
              Invitations worth opening<span className="text-brand-brass">.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Pick a design, add the when and where, and send it by link. Every reply lands in one tidy
              list.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" render={<Link href="/create" />} nativeButton={false}>
                Create an invite
              </Button>
              <Button size="lg" variant="outline" render={<Link href="#designs" />} nativeButton={false}>
                Browse designs
              </Button>
            </div>
          </div>

          <div className="relative h-72 overflow-hidden rounded-3xl bg-brand-field sm:h-96 lg:h-[26rem]">
            <div
              aria-hidden
              className="absolute inset-0 opacity-40 [background-image:repeating-linear-gradient(0deg,color-mix(in_oklab,var(--brand-on-forest)_8%,transparent)_0_1px,transparent_1px_4px),repeating-linear-gradient(90deg,color-mix(in_oklab,var(--brand-on-forest)_6%,transparent)_0_1px,transparent_1px_4px)]"
            />
            <CardArt
              name="wedding"
              alt="Example wedding invitation in the Olive Grove design"
              priority
              className="top-1/2 left-1/2 w-32 -translate-x-[118%] -translate-y-[48%] -rotate-[9deg] sm:w-40 lg:w-48"
            />
            <CardArt
              name="milestone"
              alt="Example 50th birthday invitation in the Gilt Noir design"
              priority
              className="top-1/2 left-1/2 w-32 translate-x-[18%] -translate-y-[46%] rotate-[7deg] sm:w-40 lg:w-48"
            />
            <CardArt
              name="birthday"
              alt="Example kids' birthday invitation in the Sprinkles design"
              priority
              className="top-1/2 left-1/2 z-10 w-32 -translate-x-1/2 -translate-y-[52%] -rotate-[2deg] sm:w-40 lg:w-48"
            />
          </div>
        </section>

        <nav aria-label="Occasions" className="mx-auto w-full max-w-6xl">
          <ul className="flex snap-x gap-3 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:justify-center sm:px-6 [&::-webkit-scrollbar]:hidden">
            {STRIP.map((o, i) => (
              <li key={o.icon} className="shrink-0 snap-start">
                <Link
                  href={o.href}
                  className={`group flex w-24 flex-col items-center gap-2 rounded-2xl py-1 text-center text-xs font-medium text-foreground ${linkFocus}`}
                >
                  <span
                    aria-hidden
                    className={`grid size-14 place-items-center rounded-full ring-1 transition-colors duration-(--duration-fast) motion-reduce:transition-none ${
                      i === 0
                        ? "bg-brand-field text-brand-on-forest ring-brand-field"
                        : "bg-card text-brand-heading ring-border group-hover:bg-accent"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={ICON_PATHS[o.icon]} />
                    </svg>
                  </span>
                  {o.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section
          id="designs"
          className="mx-auto w-full max-w-6xl scroll-mt-4 px-4 sm:px-6"
          aria-labelledby="occasions-title"
        >
          <h2 id="occasions-title" className="font-heading text-3xl text-brand-heading sm:text-5xl">
            What do you want to send?
          </h2>
          <p className="mt-2 text-muted-foreground">Pick an occasion to start your invitation.</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-3">
            {OCCASIONS.map((o) => (
              <li key={o.slug}>
                <Link href={`/create/${o.slug}`} className={`group block rounded-3xl ${linkFocus}`}>
                  <span
                    className={`relative block aspect-[7/8] overflow-hidden rounded-3xl ring-1 ring-border ${o.backdrop}`}
                  >
                    <CardArt
                      name={o.art}
                      className={`top-1/2 left-1/2 w-[40%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-(--duration-base) group-hover:-translate-y-[53%] motion-reduce:transition-none ${o.tilt}`}
                    />
                  </span>
                  <span className="mt-3 flex flex-col gap-0.5 px-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                    <span className="font-heading text-xl text-brand-heading sm:text-2xl">{o.name}</span>
                    <span className="text-sm text-muted-foreground">{o.caption}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="how" className="scroll-mt-4 bg-brand-linen py-14 sm:py-20" aria-labelledby="how-title">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 id="how-title" className="font-heading text-3xl text-brand-heading sm:text-4xl">
              How it works
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2">
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
            Create an invite
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
