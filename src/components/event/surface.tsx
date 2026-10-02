import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Card/glass panel treatment (build-out plan rich-blocks extension §4.3
 * "surface"). Reads the `data-ev-surface` attribute `<EventTheme>` sets on
 * an ancestor — under `plain` (the default, today's look) it adds no
 * styles, so every panel-shaped block can wrap itself in `<EvCard>`
 * unconditionally without changing its appearance on templates that don't
 * opt into `surface`.
 *
 * `glass` blurs only from the `md` breakpoint up: `backdrop-filter`
 * recomposites on every scroll frame and is expensive on low-end phones.
 * Below `md` the surface is still translucent (72% alpha) without blur, so
 * it still reads as "glass"; its contrast is guaranteed server-side for
 * *both* the narrow (72%) and wide (55%) alpha blends — see
 * `glassAlphaNarrow`/`glassAlphaWide`/`blendHex` in
 * `internal/content/manifest.go` on the backend. Keep these two alpha
 * values in sync with that file.
 */
export function EvCard({
  as: Component = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Component
      className={cn(
        // card
        "in-data-[ev-surface=card]:rounded-3xl in-data-[ev-surface=card]:border in-data-[ev-surface=card]:border-(--ev-muted)/15 in-data-[ev-surface=card]:bg-(--ev-surface) in-data-[ev-surface=card]:p-5 in-data-[ev-surface=card]:shadow-sm",
        // glass: 72% below md, 55% + blur from md up; no blur/vignette under prefers-reduced-transparency
        "in-data-[ev-surface=glass]:rounded-3xl in-data-[ev-surface=glass]:border in-data-[ev-surface=glass]:border-(--ev-surface)/40 in-data-[ev-surface=glass]:bg-(--ev-surface)/72 in-data-[ev-surface=glass]:p-5 in-data-[ev-surface=glass]:shadow-[0_8px_30px_-12px_var(--ev-accent)]",
        "md:in-data-[ev-surface=glass]:bg-(--ev-surface)/55 md:in-data-[ev-surface=glass]:backdrop-blur-md md:in-data-[ev-surface=glass]:backdrop-saturate-150",
        "[@media(prefers-reduced-transparency:reduce)]:in-data-[ev-surface=glass]:bg-(--ev-surface) [@media(prefers-reduced-transparency:reduce)]:in-data-[ev-surface=glass]:backdrop-blur-none",
        // hover lift, hover-capable pointers and motion allowed only
        "[@media(hover:hover)]:motion-safe:in-data-[ev-surface=glass]:transition-transform [@media(hover:hover)]:motion-safe:in-data-[ev-surface=glass]:hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </Component>
  );
}
