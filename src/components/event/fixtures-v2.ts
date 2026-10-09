import type { Theme } from "@/lib/api-types";

// RESOLVED schema-2 themes, hand-written to match what `content.ResolveTheme`
// emits for the default palette of three launch themes (design/src/v2/themes.mjs):
// engine 2, every colour token replaced by hex, `block.color` = accent, unset
// glow/vignette omitted, defaults (region, opacity, density) written out, and
// the v1 fields (decoration, surface, texture) holding the old-renderer
// fallbacks. Like `fixtures.ts`, QA data only; real pages get this from the API.

/** Olive Grove, palette "ivory": a split wedding invite on ivory card with a foil double frame. */
export const oliveGroveIvory: Theme = {
  layout: "split",
  hero_style: "text_only",
  decoration: "none",
  surface: "card",
  texture: "none",
  heading_scale: "display",
  accent_ink: "#77592A",
  palette: {
    background: "#F3EEE3",
    surface: "#FBF8F1",
    text: "#2C382D",
    muted: "#5A6457",
    accent: "#2F4A37",
    accent_text: "#FBF8F1",
  },
  fonts: { heading: "bodoni_moda", body: "montserrat", accent: "pinyon_script" },
  background: null,
  engine: 2,
  layers: [
    { kind: "paper", region: "page", tone: "#F3EEE3", glow: "#FFFDF8", glow_opacity: 1, vignette: "#E5DCC8", vignette_opacity: 1 },
    { kind: "texture", region: "page", texture: "fibers", opacity: 0.06, blend: "multiply" },
    {
      kind: "art",
      region: "page",
      art: "olive_branches",
      placement: "corners",
      colors: ["#5F6E55", "#C9D3B8", "#DCE2CF", "#4A5531"],
      opacity: 1,
    },
    { kind: "texture", region: "page", texture: "grain", opacity: 0.1, blend: "multiply" },
    { kind: "frame", region: "page", frame: "double_hairline", inset: 12, paint: "foil" },
  ],
  art: ["#5F6E55", "#C9D3B8", "#DCE2CF", "#4A5531", "#FFFDF8", "#E5DCC8"],
  foil: ["#8E6B2E", "#C9A963", "#F3E2AA", "#B48A43", "#E6CC8B"],
  ornament: { hero: "wreath_monogram", divider: "olive_sprig", badge: "none", ampersand: "script", hero_ink: "#77592A" },
  card: { style: "reply_card", border: "foil_inset", radius: 3, fields: "underline", buttons: "accent" },
  motion: "draw_on",
};

/** Sprinkles, palette "cobalt": a kids' birthday with a scalloped colour-block hero. */
export const sprinklesCobalt: Theme = {
  layout: "split",
  hero_style: "color_block",
  decoration: "none",
  surface: "card",
  texture: "none",
  heading_scale: "display",
  accent_ink: "#C8174A",
  palette: {
    background: "#FFF4DC",
    surface: "#FFFFFF",
    text: "#211A4D",
    muted: "#4D4677",
    accent: "#2B4BE0",
    accent_text: "#FFFFFF",
  },
  fonts: { heading: "bagel_fat_one", body: "figtree", accent: "figtree" },
  background: null,
  engine: 2,
  layers: [
    { kind: "paper", region: "page", tone: "#FFF4DC", glow: "#FFC21A", glow_opacity: 0.35 },
    { kind: "block", region: "hero", edge: "scallop", color: "#2B4BE0" },
    {
      kind: "pattern",
      region: "hero",
      pattern: "halftone",
      color: "#FFFFFF",
      opacity: 0.24,
      origin: "top_right",
      mask: "corner",
    },
    {
      kind: "art",
      region: "hero",
      art: "confetti",
      placement: "hero",
      colors: ["#FFC21A", "#FF4F7B", "#16C79A", "#FF8A3D", "#FFFFFF"],
      opacity: 1,
      density: "dense",
    },
    {
      kind: "art",
      region: "hero",
      art: "balloons",
      placement: "hero_top",
      colors: ["#FF4F7B", "#FFC21A", "#16C79A", "#FF8A3D"],
      opacity: 1,
    },
    {
      kind: "art",
      region: "page",
      art: "confetti",
      placement: "edges",
      colors: ["#2B4BE0", "#FF4F7B", "#16C79A", "#FF8A3D", "#FFC21A"],
      opacity: 1,
      density: "normal",
    },
    { kind: "texture", region: "page", texture: "grain", opacity: 0.12, blend: "multiply" },
  ],
  art: ["#FFC21A", "#FF4F7B", "#16C79A", "#FF8A3D", "#FFFFFF"],
  ornament: { hero: "sticker_numeral", divider: "squiggle", badge: "starburst_sticker", ampersand: "none", hero_ink: "#FFFFFF" },
  card: { style: "sticker", border: "ink", radius: 28, fields: "boxed", buttons: "accent" },
  motion: "pop_and_settle",
};

/** Gilt Noir, palette "noir": a 1920s supper-club party in black lacquer and foil. */
export const giltNoirNoir: Theme = {
  layout: "split",
  hero_style: "text_only",
  decoration: "none",
  surface: "card",
  texture: "none",
  heading_scale: "display",
  accent_ink: "#D4B06A",
  palette: {
    background: "#0E0D0A",
    surface: "#17150F",
    text: "#F3EAD7",
    muted: "#BCAF97",
    accent: "#C9A45C",
    accent_text: "#15120B",
  },
  fonts: { heading: "limelight", body: "josefin_sans", accent: "josefin_sans" },
  background: null,
  engine: 2,
  layers: [
    { kind: "paper", region: "page", tone: "#0E0D0A", glow: "#C9A45C", glow_opacity: 0.26 },
    {
      kind: "pattern",
      region: "page",
      pattern: "sunburst",
      color: "#C9A45C",
      opacity: 0.15,
      origin: "top",
      mask: "radial",
    },
    { kind: "art", region: "page", art: "stepped_arches", placement: "hero", paint: "foil", opacity: 1 },
    {
      kind: "pattern",
      region: "page",
      pattern: "pinstripe",
      color: "#F3EAD7",
      opacity: 0.03,
      origin: "center",
      mask: "none",
    },
    { kind: "texture", region: "page", texture: "grain", opacity: 0.16, blend: "screen" },
    {
      kind: "art",
      region: "page",
      art: "deco_fans",
      placement: "bottom_corners",
      colors: ["#C9A45C"],
      opacity: 0.6,
    },
    { kind: "frame", region: "page", frame: "double_hairline_deco_corners", inset: 10, paint: "foil" },
  ],
  art: ["#C9A45C", "#8E7440"],
  foil: ["#E3C779", "#C9A45C", "#F3E2AA", "#B48A43", "#D9B769"],
  ornament: { hero: "foil_numeral", divider: "deco_diamond", badge: "none", ampersand: "none", hero_ink: "#D4B06A" },
  card: { style: "chamfered", border: "foil", radius: 0, fields: "underline", buttons: "foil" },
  motion: "foil_sheen",
};

export const fixtureThemesV2: Record<"olive-grove" | "sprinkles" | "gilt-noir", Theme> = {
  "olive-grove": oliveGroveIvory,
  sprinkles: sprinklesCobalt,
  "gilt-noir": giltNoirNoir,
};
