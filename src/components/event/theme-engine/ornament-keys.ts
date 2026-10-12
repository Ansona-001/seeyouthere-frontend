import type { ThemeLayer } from "@/lib/api-types";

import { ownKey } from "./safe.ts";

/**
 * Pure, dependency-free helpers for the v2 hero and ornaments, kept out of the
 * `.tsx` files so `node --test` can import them directly. Every value arrives
 * from a resolved theme or hero block and is treated as untrusted: unknown
 * keys map to `null` (render nothing), text is whitelisted character by
 * character.
 */

const HERO_ORNAMENTS = {
  wreath_monogram: 0,
  sticker_numeral: 0,
  foil_numeral: 0,
  ring: 0,
  cloud: 0,
  doorway: 0,
  monogram_rule: 0,
} as const;
const DIVIDER_ORNAMENTS = {
  line: 0,
  floral: 0,
  dots: 0,
  heart: 0,
  olive_sprig: 0,
  squiggle: 0,
  deco_diamond: 0,
  wave: 0,
  sparkle_rule: 0,
} as const;
const BADGE_ORNAMENTS = {
  starburst_sticker: 0,
  wax_seal: 0,
  foil_seal: 0,
} as const;

export type HeroOrnamentKey = keyof typeof HERO_ORNAMENTS;
export type DividerOrnamentKey = keyof typeof DIVIDER_ORNAMENTS;
export type BadgeOrnamentKey = keyof typeof BADGE_ORNAMENTS;

/** A known hero ornament key, or `null` for `none`, unknown and non-string values. */
export function heroOrnamentKey(value: unknown): HeroOrnamentKey | null {
  return ownKey(HERO_ORNAMENTS, value);
}

/** A known divider ornament key, or `null`. */
export function dividerOrnamentKey(value: unknown): DividerOrnamentKey | null {
  return ownKey(DIVIDER_ORNAMENTS, value);
}

/** A known badge ornament key, or `null`. */
export function badgeOrnamentKey(value: unknown): BadgeOrnamentKey | null {
  return ownKey(BADGE_ORNAMENTS, value);
}

/** Longest hero badge the API accepts (runes). */
export const BADGE_MAX = 4;

const BADGE_CHAR = /^[\p{L}\p{Nd}&·+-]$/u;

/**
 * The hero badge text as it may be rendered: only Unicode letters, digits and
 * `& · + -`, at most four characters. This mirrors the backend's `checkBadge`
 * (which rejects, where this drops) so content from an older or hostile source
 * can never reach the page with markup, whitespace or control characters in it.
 */
export function sanitizeBadge(value: unknown): string {
  if (typeof value !== "string") return "";
  const out: string[] = [];
  for (const ch of value) {
    if (out.length === BADGE_MAX) break;
    if (BADGE_CHAR.test(ch)) out.push(ch);
  }
  return out.join("");
}

/** Pieces of a hero title: plain text runs and ampersands (to set in the accent font). */
export type TitlePart = { text: string; amp: boolean };

/**
 * Splits a title on `&` so the ampersand can be set in the accent (script)
 * font. The text is never interpreted as markup: the parts are rendered as
 * React text. Whitespace around an ampersand is trimmed, empty runs dropped.
 */
export function splitTitle(title: string): TitlePart[] {
  const parts: TitlePart[] = [];
  title.split("&").forEach((run, i) => {
    if (i > 0) parts.push({ text: "&", amp: true });
    const text = i === 0 ? run.trimEnd() : run.trim();
    if (text) parts.push({ text, amp: false });
  });
  return parts;
}

/** Space the text column keeps clear of art drawn at the page edges, in px at phone width. */
export type ArtClearance = { top: number; bottom: number; reserve: number };

const CLEARANCE: Record<string, { top?: number; bottom?: number; reserve?: number }> = {
  olive_branches: { top: 118, bottom: 70 },
  botanical_wash: { top: 150, bottom: 60 },
  printers_corners: { top: 96, bottom: 40 },
  daisies: { top: 96, bottom: 70 },
  riso_shapes: { top: 150, bottom: 150 },
  deco_fans: { bottom: 110 },
  open_door_plants: { bottom: 170 },
  clouds: { top: 120 },
  mirror_ball: { reserve: 236 },
};

const TOP_PLACEMENTS = new Set(["corners", "top_corners", "top"]);
const BOTTOM_PLACEMENTS = new Set(["corners", "bottom_corners"]);

/**
 * How far the hero text must sit below the top of the page (`top`, art in the
 * corners or a top band), how much room the end of the page needs (`bottom`),
 * and how much a `hero_top` piece reserves above the hero text (`reserve`).
 * `drawn` says whether the art component for a key exists, so nothing is
 * reserved for art that does not render.
 */
export function artClearance(layers: readonly ThemeLayer[] | undefined, drawn: (key: string) => boolean): ArtClearance {
  const out: ArtClearance = { top: 0, bottom: 0, reserve: 0 };
  for (const layer of layers ?? []) {
    if (layer.kind !== "art" || !drawn(layer.art)) continue;
    const c = ownKey(CLEARANCE, layer.art);
    if (!c) continue;
    const spec = CLEARANCE[c];
    const page = (layer.region ?? "page") === "page";
    if (page && TOP_PLACEMENTS.has(layer.placement)) out.top = Math.max(out.top, spec.top ?? 0);
    if (page && BOTTOM_PLACEMENTS.has(layer.placement)) out.bottom = Math.max(out.bottom, spec.bottom ?? 0);
    if (layer.placement === "hero_top") out.reserve = Math.max(out.reserve, spec.reserve ?? 0);
  }
  return out;
}
