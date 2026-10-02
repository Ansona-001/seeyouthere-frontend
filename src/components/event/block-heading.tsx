import { cn } from "@/lib/utils";

import { Kicker } from "./kicker";

/**
 * Kicker + section heading pair (build-out plan rich-blocks extension §4.3
 * "heading_scale", §1.5 "kicker"). Renders nothing when both are empty, so
 * callers can use it unconditionally in place of the old ad-hoc `<h2>`.
 *
 * `heading_scale: "display"` (via the ancestor `data-ev-headings`
 * attribute) scales the heading up with a subtle glow, matching the
 * reference design; `"regular"` (the default) keeps today's size exactly.
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
            "in-data-[ev-headings=display]:text-[clamp(2.25rem,7vw,4rem)] in-data-[ev-headings=display]:leading-[1.05] in-data-[ev-headings=display]:font-semibold in-data-[ev-headings=display]:[text-shadow:0_0_24px_color-mix(in_srgb,currentColor_15%,transparent)]",
          )}
        >
          {heading}
        </h2>
      )}
    </hgroup>
  );
}
