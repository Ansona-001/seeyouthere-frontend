"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import type { Occasion } from "@/lib/api-types";

// Cards shown for each occasion (the same previews as the home page).
const CARD_IMAGES: Record<string, string> = {
  wedding: "/landing/card-wedding.webp",
  engagement: "/landing/card-engagement.webp",
  birthday: "/landing/card-birthday.webp",
  "baby-shower": "/landing/card-baby-shower.webp",
  housewarming: "/landing/card-housewarming.webp",
  party: "/landing/card-party.webp",
};

const SWIPE_PX = 40;
// Cards further than this from the centre are hidden. Besides keeping the 3D layer count small, it
// means a card wrapping round from one end of the loop to the other does so while invisible.
const VISIBLE_RANGE = 2;

/**
 * Cover-flow occasion picker: the chosen occasion faces forward, the rest fan out to either side.
 * Tap a side card (or use the arrows, arrow keys or a swipe) to bring it forward; the centre card
 * opens that occasion. It loops: past the last occasion comes the first. Pure CSS transforms, no
 * animation library.
 */
export function OccasionCoverflow({ occasions }: { occasions: Occasion[] }) {
  // Open on birthday (a colourful card in the middle of the fan); fall back to the middle one.
  const [active, setActive] = useState(() => {
    const birthday = occasions.findIndex((o) => o.slug === "birthday");
    return birthday >= 0 ? birthday : Math.floor((occasions.length - 1) / 2);
  });
  const dragStart = useRef<number | null>(null);
  const current = occasions[active];

  function go(delta: number) {
    setActive((i) => (i + delta + occasions.length) % occasions.length);
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Occasions"
      className="flex flex-col items-center gap-6"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        else if (e.key === "ArrowRight") go(1);
        else return;
        e.preventDefault();
      }}
    >
      <div
        className="relative h-[22rem] w-full touch-pan-y overflow-hidden select-none [--cf-unit:0.7px] [perspective:1100px] sm:h-[28rem] sm:[--cf-unit:1px]"
        onPointerDown={(e) => {
          dragStart.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (dragStart.current === null) return;
          const dx = e.clientX - dragStart.current;
          dragStart.current = null;
          if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
      >
        {occasions.map((occasion, i) => {
          // Shortest signed distance round the loop, so the fan wraps instead of ending.
          let d = (((i - active) % occasions.length) + occasions.length) % occasions.length;
          if (d > occasions.length / 2) d -= occasions.length;
          const side = Math.sign(d);
          const distance = Math.abs(d);
          const hidden = distance > VISIBLE_RANGE;
          // Unitless offsets multiplied by --cf-unit so phones get a tighter fan.
          const x = d === 0 ? 0 : side * (170 + (distance - 1) * 70);
          const image = CARD_IMAGES[occasion.slug];
          return (
            <Link
              key={occasion.slug}
              href={`/create/${occasion.slug}`}
              aria-label={occasion.name}
              aria-current={d === 0 ? "true" : undefined}
              tabIndex={d === 0 ? 0 : -1}
              draggable={false}
              onClick={(e) => {
                // A side card comes forward first; only the centre card navigates.
                if (d !== 0) {
                  e.preventDefault();
                  setActive(i);
                }
              }}
              className={cn(
                "absolute top-1/2 left-1/2 block w-44 overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-foreground/10 outline-none sm:w-60",
                "transition-[transform,opacity] duration-500 ease-out focus-visible:ring-3 focus-visible:ring-ring/60 motion-reduce:transition-none",
                // Hidden cards fade without sliding, so one wrapping round the back is never seen crossing.
                hidden && "pointer-events-none opacity-0 transition-[opacity]",
              )}
              style={{
                transform: `translate(-50%, -50%) translateX(calc(${x} * var(--cf-unit))) rotateY(${-side * 55}deg) scale(${d === 0 ? 1 : 0.86})`,
                zIndex: 10 - distance,
              }}
            >
              {image ? (
                <Image src={image} alt="" width={390} height={520} unoptimized draggable={false} className="aspect-3/4 w-full object-cover" />
              ) : (
                <span className="grid aspect-3/4 place-items-center bg-secondary p-4 text-center font-heading text-2xl text-brand-heading">{occasion.name}</span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex w-full max-w-md items-center justify-between gap-3">
        <Button type="button" variant="outline" size="icon" aria-label="Previous occasion" onClick={() => go(-1)}>
          <ChevronLeftIcon />
        </Button>
        <div className="min-w-0 text-center" aria-live="polite">
          <p className="font-heading text-3xl text-brand-heading">{current.name}</p>
          {current.copy.tagline && <p className="mt-1 text-muted-foreground">{current.copy.tagline}</p>}
        </div>
        <Button type="button" variant="outline" size="icon" aria-label="Next occasion" onClick={() => go(1)}>
          <ChevronRightIcon />
        </Button>
      </div>

      <Link href={`/create/${current.slug}`} className={buttonVariants({ size: "lg" })}>
        Start a {current.name.toLowerCase()} invite
      </Link>
    </div>
  );
}
