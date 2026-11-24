import Image from "next/image";

import { cn } from "@/lib/utils";

/** The occasions that have card art in `public/landing` (the same set as the landing page). */
export const OCCASION_ART = ["wedding", "birthday", "baby-shower", "housewarming", "engagement", "party", "function"] as const;

type OccasionArtSlug = (typeof OCCASION_ART)[number];

function artSlug(slug: string): OccasionArtSlug {
  return (OCCASION_ART as readonly string[]).includes(slug) ? (slug as OccasionArtSlug) : "wedding";
}

/**
 * A tile painted in an occasion's colours (via `data-occasion`) with its card art resting in it. Decorative;
 * callers label the link or heading it sits in.
 */
export function OccasionTile({ slug, className, site = false }: { slug: string; className?: string; site?: boolean }) {
  const art = artSlug(slug);
  if (site) return <SiteTile className={className} />;
  return (
    <span
      aria-hidden
      data-occasion={art}
      className={cn("relative block overflow-hidden bg-(--ground)", className)}
    >
      <Image
        src={`/landing/card-${art}.webp`}
        alt=""
        width={390}
        height={520}
        // Already cropped and compressed; the site's custom loader only serves media renditions.
        unoptimized
        className="absolute top-1/2 left-1/2 h-auto w-[44%] -translate-x-1/2 -translate-y-1/2 rounded-md shadow-[0_10px_20px_-10px_rgb(0_0_0/0.5)] [@media(hover:hover)]:transition-transform"
      />
    </span>
  );
}

/**
 * The tile for hosted events: a miniature website (browser bar, banner, text lines) in the stage colours instead of
 * an invitation card, in its own teal so an event never looks like the "On stage" invite.
 */
function SiteTile({ className }: { className?: string }) {
  return (
    <span aria-hidden data-occasion="site" className={cn("relative block overflow-hidden bg-(--ground)", className)}>
      <span className="absolute top-1/2 left-1/2 flex aspect-[5/4] w-[62%] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-md bg-(--on) shadow-[0_10px_20px_-10px_rgb(0_0_0/0.5)]">
        <span className="flex h-[16%] shrink-0 items-center gap-[6%] bg-(--ground)/25 px-[8%]">
          <span className="size-[8%] rounded-full bg-(--ground)/50" />
          <span className="size-[8%] rounded-full bg-(--ground)/50" />
          <span className="size-[8%] rounded-full bg-(--ground)/50" />
        </span>
        <span className="mx-[8%] mt-[8%] h-[30%] rounded-sm bg-(--ground)" />
        <span className="mx-[8%] mt-[8%] h-[7%] rounded-full bg-(--ground)/35" />
        <span className="mx-[8%] mt-[5%] h-[7%] w-[60%] rounded-full bg-(--ground)/35" />
      </span>
    </span>
  );
}
