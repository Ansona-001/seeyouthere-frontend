import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Small accent-font label rendered above a heading (build-out plan
 * rich-blocks extension §1.5, §4.3 "fonts[].accent"). Colour comes from
 * `--ev-accent-ink` (server-computed, already contrast-checked against the
 * background/surface — see `Theme.accent_ink`), and the font from
 * `--ev-font-accent`, both set by `<EventTheme>`.
 *
 * Sizing reads the ancestor `data-ev-accent-script` attribute `<EventTheme>`
 * sets when the resolved accent font is a script face (`great_vibes`,
 * `birthstone`): script accents render large, like a signature; any other
 * font renders as a small letter-spaced uppercase label. Callers place this
 * above their heading; it renders nothing on its own layout assumptions
 * (text alignment/centering is the caller's).
 */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-(--ev-accent-ink) [font-family:var(--ev-font-accent)]",
        "text-xs tracking-[0.3em] uppercase",
        "in-data-[ev-accent-script]:-mb-2 in-data-[ev-accent-script]:text-4xl in-data-[ev-accent-script]:tracking-normal in-data-[ev-accent-script]:normal-case in-data-[ev-accent-script]:sm:text-5xl",
        className,
      )}
    >
      {children}
    </p>
  );
}
