import type { CSSProperties, ReactNode } from "react";

import type { Texture, Theme } from "@/lib/api-types";
import { fontCssVar, SCRIPT_FONTS } from "@/lib/fonts";
import { cn } from "@/lib/utils";

/**
 * CSS custom properties for a resolved theme (build-out plan §11.3; rich-
 * blocks extension §4.2). Colours are hex strings validated server-side
 * (`content.ValidateManifest`); we still only ever place them in a `style`
 * attribute, never in HTML or CSS text a browser would parse as executable.
 *
 * `accent_ink` and `fonts.accent` are optional on the wire (an older API
 * might omit them) — fall back to `palette.accent` / `fonts.heading` so a
 * theme without them renders identically to today.
 */
export function themeStyle(theme: Theme): CSSProperties {
  return {
    "--ev-bg": theme.palette.background,
    "--ev-surface": theme.palette.surface,
    "--ev-text": theme.palette.text,
    "--ev-muted": theme.palette.muted,
    "--ev-accent": theme.palette.accent,
    "--ev-accent-text": theme.palette.accent_text,
    "--ev-accent-ink": theme.accent_ink || theme.palette.accent,
    "--ev-font-heading": fontCssVar(theme.fonts.heading),
    "--ev-font-body": fontCssVar(theme.fonts.body),
    "--ev-font-accent": fontCssVar(theme.fonts.accent || theme.fonts.heading),
  } as CSSProperties;
}

/** Compositor-only background layer for `theme.texture` (rich-blocks §4.3/§6.2). */
const TEXTURE_CLASS: Record<Texture, string> = {
  none: "",
  grid:
    "bg-[linear-gradient(color-mix(in_srgb,var(--ev-accent)_12%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--ev-accent)_12%,transparent)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(circle,black_30%,transparent_90%)]",
  dots:
    "bg-[radial-gradient(color-mix(in_srgb,var(--ev-accent)_12%,transparent)_1px,transparent_1px)] bg-[size:18px_18px] [mask-image:radial-gradient(circle,black_30%,transparent_90%)]",
};

/**
 * Subtle background texture, `aria-hidden` and non-interactive. `fixed` on
 * the live page (a viewport-wide vignette, like the reference design,
 * without repainting on scroll — never `background-attachment: fixed`,
 * which does repaint and is ignored by iOS); `absolute` in the editor
 * preview pane, where a `fixed` layer would escape the preview and cover the
 * rest of the editor UI. Browsers without `color-mix` simply drop the
 * background declaration (no texture) — a safe, silent fallback.
 */
function TextureLayer({ texture, fixed }: { texture: Texture; fixed: boolean }) {
  if (texture === "none") return null;
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none inset-0 -z-10", fixed ? "fixed" : "absolute", TEXTURE_CLASS[texture])}
    />
  );
}

export function EventTheme({
  theme,
  mode = "live",
  className,
  children,
}: {
  theme: Theme;
  /** `"live"` renders the texture layer viewport-fixed; `"preview"` (editor pane) keeps it absolute. */
  mode?: "live" | "preview";
  className?: string;
  children: ReactNode;
}) {
  const surface = theme.surface ?? "plain";
  const texture = theme.texture ?? "none";
  const headingScale = theme.heading_scale ?? "regular";
  const accentFont = theme.fonts.accent || theme.fonts.heading;

  return (
    <div
      data-ev-theme=""
      data-ev-surface={surface}
      data-ev-texture={texture}
      data-ev-headings={headingScale}
      data-ev-accent-script={SCRIPT_FONTS.has(accentFont) ? "" : undefined}
      style={themeStyle(theme)}
      className={cn(
        "relative isolate bg-(--ev-bg) text-(--ev-text) [font-family:var(--ev-font-body)]",
        className,
      )}
    >
      <TextureLayer texture={texture} fixed={mode === "live"} />
      {children}
    </div>
  );
}
