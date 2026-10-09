import {
  Bagel_Fat_One,
  Birthstone,
  Bodoni_Moda,
  Bricolage_Grotesque,
  Cormorant_Garamond,
  DM_Serif_Display,
  Figtree,
  Fraunces,
  Great_Vibes,
  Josefin_Sans,
  Limelight,
  Lora,
  Montserrat,
  Pinyon_Script,
  Playfair_Display,
} from "next/font/google";

import type { FontKey } from "./api-types";

/**
 * The fifteen font families a template manifest may reference (build-out plan
 * §3.4; rich-blocks extension §4.4 added `birthstone`/`montserrat`). This
 * list MUST match the Go allowlist in `internal/content/manifest.go` on the
 * backend — the server validates every manifest against it, so this file
 * only needs to keep the *rendering* side in sync. `great_vibes` and
 * `birthstone` are heading/accent-only by backend convention (never valid as
 * a body font); we don't re-enforce that here since the manifest is
 * validated server-side.
 *
 * All are loaded once at module scope (a next/font requirement). Figtree and
 * Bricolage Grotesque double as the site's own UI font (`font-sans`/
 * `font-heading` in globals.css) so they're preloaded; the other thirteen are
 * only used by whichever event theme is on screen, so `preload: false` keeps
 * a page paying for just the two or three fonts its theme actually needs.
 */
export const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  preload: false,
  display: "swap",
});
const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant-garamond",
  preload: false,
  display: "swap",
});
const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif-display",
  preload: false,
  display: "swap",
});
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", preload: false, display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", preload: false, display: "swap" });
const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  preload: false,
  display: "swap",
});
const birthstone = Birthstone({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-birthstone",
  preload: false,
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  preload: false,
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-bodoni-moda",
  preload: false,
  display: "swap",
});
const pinyonScript = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pinyon-script",
  preload: false,
  display: "swap",
});
const bagelFatOne = Bagel_Fat_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bagel-fat-one",
  preload: false,
  display: "swap",
});
const limelight = Limelight({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-limelight",
  preload: false,
  display: "swap",
});
const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-josefin-sans",
  preload: false,
  display: "swap",
});

const FONT_VARIABLE: Record<FontKey, string> = {
  figtree: figtree.variable,
  bricolage_grotesque: bricolageGrotesque.variable,
  playfair_display: playfairDisplay.variable,
  cormorant_garamond: cormorantGaramond.variable,
  dm_serif_display: dmSerifDisplay.variable,
  lora: lora.variable,
  fraunces: fraunces.variable,
  great_vibes: greatVibes.variable,
  birthstone: birthstone.variable,
  montserrat: montserrat.variable,
  bodoni_moda: bodoniModa.variable,
  pinyon_script: pinyonScript.variable,
  bagel_fat_one: bagelFatOne.variable,
  limelight: limelight.variable,
  josefin_sans: josefinSans.variable,
};

const FONT_CSS_VAR: Record<FontKey, string> = {
  figtree: "var(--font-figtree)",
  bricolage_grotesque: "var(--font-bricolage)",
  playfair_display: "var(--font-playfair-display)",
  cormorant_garamond: "var(--font-cormorant-garamond)",
  dm_serif_display: "var(--font-dm-serif-display)",
  lora: "var(--font-lora)",
  fraunces: "var(--font-fraunces)",
  great_vibes: "var(--font-great-vibes)",
  birthstone: "var(--font-birthstone)",
  montserrat: "var(--font-montserrat)",
  bodoni_moda: "var(--font-bodoni-moda)",
  pinyon_script: "var(--font-pinyon-script)",
  bagel_fat_one: "var(--font-bagel-fat-one)",
  limelight: "var(--font-limelight)",
  josefin_sans: "var(--font-josefin-sans)",
};

/**
 * Font keys that render as a decorative script face (build-out plan
 * rich-blocks §4.4). Presentation only — used to size a `Kicker` (large
 * script vs. small tracked-uppercase label); the backend enforces that
 * these are never a valid `body` font.
 */
export const SCRIPT_FONTS: ReadonlySet<FontKey> = new Set(["great_vibes", "birthstone", "pinyon_script"]);

/**
 * Space-separated class list of every allowlisted font's CSS variable. Add
 * this to `<html className>` in the root layout so any event theme rendered
 * anywhere in the app (editor preview, public page, admin template preview)
 * can reference its two chosen fonts via CSS variables.
 */
export const eventFontVariables = Object.values(FONT_VARIABLE).join(" ");

/** Resolves a manifest font key to the `var(--font-…)` reference for inline styles. */
export function fontCssVar(key: FontKey): string {
  return FONT_CSS_VAR[key];
}
