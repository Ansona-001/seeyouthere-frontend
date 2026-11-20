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
export function OccasionTile({ slug, className }: { slug: string; className?: string }) {
  const art = artSlug(slug);
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
