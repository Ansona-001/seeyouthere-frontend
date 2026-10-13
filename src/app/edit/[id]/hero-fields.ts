import { badgeOrnamentKey, heroOrnamentKey } from "../../../components/event/theme-engine/ornament-keys.ts";
import type { Theme } from "@/lib/api-types";

/**
 * Which Hero fields the selected template actually draws, so the editor only asks for those. Mirrors
 * the rules in `HeroBlock` (schema 1) and `HeroV2` (theme engine v2); keep them in step.
 */

/** Hero styles that draw the hero photo (the others are text only). */
const PHOTO_STYLES: ReadonlySet<string> = new Set(["full_bleed", "framed", "spotlight", "color_block"]);

/** Hero ornaments that print the badge text (monogram, rule or numeral). */
const BADGE_HERO_ORNAMENTS: ReadonlySet<string> = new Set(["wreath_monogram", "monogram_rule", "sticker_numeral", "foil_numeral"]);

export function heroDrawsPhoto(theme: Theme): boolean {
  if (!PHOTO_STYLES.has(theme.hero_style)) return false;
  // A v2 colour block without a block layer falls back to text only.
  if (theme.hero_style === "color_block" && !(theme.layers?.some((l) => l.kind === "block") ?? false)) return false;
  return true;
}

export function heroDrawsBadge(theme: Theme): boolean {
  if (theme.engine !== 2) return false;
  const ornament = heroOrnamentKey(theme.ornament?.hero);
  return (ornament !== null && BADGE_HERO_ORNAMENTS.has(ornament)) || badgeOrnamentKey(theme.ornament?.badge) !== null;
}
