import { cn } from "@/lib/utils";

import { Kicker } from "./kicker";

/**
 * Kicker + section heading pair (build-out plan rich-blocks extension §4.3
 * "heading_scale", §1.5 "kicker"). Renders nothing when both are empty, so
 * callers can use it unconditionally in place of the old ad-hoc `<h2>`.
 *
 * `heading_scale: "display"` (via the ancestor `data-ev-headings`
 * attribute) scales the heading up with a subtle glow, matching the
 * reference design; `"classic"` is the same size in a light, glow-free
 * serif for script-accent themes (Heirloom); `"regular"` (the default)
 * keeps today's size exactly.
 */
export function BlockHeading({
  kicker,
  heading,
  className,
}: {
  kicker?: string;
  heading: string;
  className?: string;
}) {
  if (!kicker && !heading) return null;

  return (
    <hgroup className={className}>
      {kicker && <Kicker>{kicker}</Kicker>}
      {heading && (
        <h2
          className={cn(
            "text-2xl font-medium [font-family:var(--ev-font-heading)]",
            "in-data-[ev-headings=display]:text-[clamp(1.75rem,5vw,2.75rem)] in-data-[ev-headings=display]:leading-[1.1] in-data-[ev-headings=display]:font-semibold in-data-[ev-headings=display]:[text-shadow:0_0_24px_color-mix(in_srgb,currentColor_15%,transparent)]",
            "in-data-[ev-headings=classic]:text-[clamp(2rem,6vw,3rem)] in-data-[ev-headings=classic]:leading-[1.1] in-data-[ev-headings=classic]:font-normal",
          )}
        >
          {heading}
        </h2>
      )}
    </hgroup>
  );
}
