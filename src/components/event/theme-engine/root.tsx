import type { CSSProperties, ReactNode } from "react";

import type { Theme } from "@/lib/api-types";
import { SCRIPT_FONTS } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { themeStyle } from "../theme";

import { foilGradient, mirroredFoilStops } from "./foil";
import { ownKey, safeHex, safeHexList, safeInt } from "./safe";

const CARD_STYLES = {
  none: 0,
  soft: 0,
  glass: 0,
  reply_card: 0,
  sticker: 0,
  chamfered: 0,
} as const;
const CARD_BORDERS = {
  none: 0,
  hairline: 0,
  ink: 0,
  foil: 0,
  foil_inset: 0,
} as const;
const CARD_FIELDS = { boxed: 0, underline: 0 } as const;
const CARD_BUTTONS = { accent: 0, foil: 0 } as const;
const MOTIONS = {
  none: 0,
  draw_on: 0,
  pop_and_settle: 0,
  foil_sheen: 0,
} as const;
const HEADING_SCALES = { regular: 0, display: 0 } as const;

/**
 * The v1 `data-ev-surface` value that reuses the existing `EvCard` soft and
 * glass classes. Every other v2 card style looks plain until its own
 * data-attribute variant styles it.
 */
function surfaceFor(style: keyof typeof CARD_STYLES): "card" | "glass" | "plain" {
  if (style === "soft") return "card";
  if (style === "glass") return "glass";
  return "plain";
}

/** Theme CSS variables plus the v2 additions (`--ev-art-N`, `--ev-foil*`, `--ev-card-radius`, `--ev-hero-ink`). */
function themeStyleV2(theme: Theme, foil: string | null): CSSProperties {
  const vars: Record<string, string> = {};
  (theme.art ?? []).slice(0, 8).forEach((color, i) => {
    const hex = safeHex(color);
    if (hex) vars[`--ev-art-${i + 1}`] = hex;
  });
  if (foil) {
    vars["--ev-foil"] = foil;
    (safeHexList(theme.foil, 3, 5) ?? []).forEach((color, i) => {
      vars[`--ev-foil-${i + 1}`] = color;
    });
  }
  vars["--ev-card-radius"] = `${safeInt(theme.card?.radius, 0, 32, 24)}px`;
  const heroInk = safeHex(theme.ornament?.hero_ink);
  if (heroInk) vars["--ev-hero-ink"] = heroInk;
  return { ...themeStyle(theme), ...vars } as CSSProperties;
}

/**
 * Root element of a schema-2 (engine 2) event. A Server Component: sets the
 * `data-ev-*` hooks the blocks and card variants key off, the CSS variables,
 * and the shared foil gradient. `@container/ev` lets the layout use container
 * queries; there is deliberately no `overflow-hidden` here, which would break
 * the sticky split hero.
 */
export function ThemeRootV2({ theme, className, children }: { theme: Theme; className?: string; children: ReactNode }) {
  const cardStyle = ownKey(CARD_STYLES, theme.card?.style) ?? "soft";
  const border = ownKey(CARD_BORDERS, theme.card?.border) ?? "hairline";
  const fields = ownKey(CARD_FIELDS, theme.card?.fields) ?? "boxed";
  const buttons = ownKey(CARD_BUTTONS, theme.card?.buttons) ?? "accent";
  const motion = ownKey(MOTIONS, theme.motion) ?? "none";
  const headings = ownKey(HEADING_SCALES, theme.heading_scale) ?? "regular";
  const accentFont = theme.fonts.accent || theme.fonts.heading;

  const foil = foilGradient(theme.foil);
  const stops = foil ? mirroredFoilStops(theme.foil) : null;

  return (
    <div
      data-ev-theme=""
      data-ev-engine="2"
      data-ev-card={cardStyle}
      data-ev-border={border}
      data-ev-fields={fields}
      data-ev-buttons={buttons}
      data-ev-motion={motion}
      data-ev-surface={surfaceFor(cardStyle)}
      data-ev-headings={headings}
      data-ev-accent-script={SCRIPT_FONTS.has(accentFont) ? "" : undefined}
      style={themeStyleV2(theme, foil)}
      className={cn(
        "@container/ev relative isolate bg-(--ev-bg) text-(--ev-text) [font-family:var(--ev-font-body)]",
        className,
      )}
    >
      {stops && (
        <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="ev-foil-grad" x1="0" y1="0" x2="1" y2="1">
              {stops.map((stop, i) => (
                <stop key={i} offset={`${stop.at}%`} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>
        </svg>
      )}
      {children}
    </div>
  );
}
