import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

import { StarburstSticker, WaxSeal, FoilSeal } from "./ornaments/badge-svg";
import {
  DecoDiamond,
  Dots,
  Floral,
  Heart,
  Line,
  OliveSprig,
  SparkleRule,
  Squiggle,
  Wave,
} from "./ornaments/divider-svg";
import { Cloud, Doorway, FoilNumeral, MonogramRule, Ring, StickerNumeral, WreathMonogram } from "./ornaments/hero-svg";
import {
  badgeOrnamentKey,
  dividerOrnamentKey,
  heroOrnamentKey,
  sanitizeBadge,
  type BadgeOrnamentKey,
  type DividerOrnamentKey,
  type HeroOrnamentKey,
} from "./ornament-keys";

/**
 * Hero, divider and badge ornaments of a schema-2 theme. All are static,
 * trusted SVG (generated from `design/art/ornaments`) painted through CSS
 * custom properties: `.ev-orn` maps `--a1..--a5` to the palette art ramp and
 * `--acc` to the accent; `--ink` is the hero ink for hero ornaments and the
 * accent ink for dividers and badges. Foil comes from the shared
 * `#ev-foil-grad` gradient that `ThemeRootV2` emits. Unknown values render
 * nothing; the hero badge is real text, whitelisted character by character.
 */

const HERO_INK = "text-[color:var(--ev-hero-ink,var(--ev-accent-ink))]";
const INK_VAR = "[--ink:var(--ev-hero-ink,var(--ev-accent-ink))]";

const SVG_ONLY: Partial<Record<HeroOrnamentKey, { Svg: ComponentType<{ className?: string }>; box: string }>> = {
  ring: { Svg: Ring, box: "w-[86px] mb-3.5" },
  cloud: { Svg: Cloud, box: "w-[210px] -mt-1.5 mb-3" },
  doorway: { Svg: Doorway, box: "w-[156px] mb-[18px]" },
};

/** `A&T` as text with the ampersand set in the accent font (and foil when the theme has it). */
function Monogram({ text, foil }: { text: string; foil: boolean }) {
  return text.split("&").map((run, i) => (
    <span key={i}>
      {i > 0 && (
        <i
          className={cn(
            "px-[3px] text-[.86em] not-italic [font-family:var(--ev-font-accent)]",
            foil ? "ev-foil-text" : HERO_INK,
          )}
        >
          &amp;
        </i>
      )}
      {run}
    </span>
  ));
}

/**
 * The ornament that sits above the hero title: wreath or rule around the badge
 * text, ring, cloud or doorway. The two numeral ornaments render nothing here
 * (see `NumeralBackdrop`).
 */
export function HeroOrnament({ ornament, badge, foil }: { ornament: unknown; badge: unknown; foil: boolean }) {
  const key = heroOrnamentKey(ornament);
  if (!key) return null;
  const text = sanitizeBadge(badge);

  if (key === "wreath_monogram") {
    return (
      <div aria-hidden="true" className={cn("ev-orn relative mx-auto mb-[18px] size-[150px]", INK_VAR)}>
        <WreathMonogram className="size-full" />
        {text && (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center pb-1.5 whitespace-nowrap text-(--ev-text) italic [font-family:var(--ev-font-heading)]",
              text.length > 3 ? "text-[25px]" : "text-[32px]",
            )}
          >
            <span>
              <Monogram text={text} foil={foil} />
            </span>
          </span>
        )}
      </div>
    );
  }

  if (key === "monogram_rule") {
    return (
      <div aria-hidden="true" className={cn("ev-orn relative mx-auto mb-[26px] w-[min(100%,320px)]", INK_VAR)}>
        <MonogramRule className="h-auto w-full" />
        {text && (
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center pb-0.5 pl-[.2em] whitespace-nowrap tracking-[.2em] [font-family:var(--ev-font-heading)]",
              HERO_INK,
              text.length > 3 ? "text-[17px]" : "text-[21px]",
            )}
          >
            {text}
          </span>
        )}
      </div>
    );
  }

  const svgOnly = SVG_ONLY[key];
  if (!svgOnly) return null;
  const { Svg, box } = svgOnly;
  return (
    <div aria-hidden="true" className={cn("ev-orn mx-auto", INK_VAR, box)}>
      <Svg className="h-auto w-full" />
    </div>
  );
}

/** The art behind a numeral title: a burst of pop lines (sticker) or a plinth (foil). `null` for other ornaments. */
export function NumeralBackdrop({ ornament }: { ornament: unknown }) {
  const key = heroOrnamentKey(ornament);
  if (key === "sticker_numeral") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "ev-orn pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[min(330px,84cqi)] -translate-x-1/2 -translate-y-[46%] @min-[900px]/ev:w-[440px]",
          INK_VAR,
        )}
      >
        <StickerNumeral className="h-auto w-full" />
      </div>
    );
  }
  if (key === "foil_numeral") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "ev-orn pointer-events-none absolute -bottom-[38px] left-1/2 -z-10 w-[min(300px,76cqi)] -translate-x-1/2 @min-[900px]/ev:-bottom-11 @min-[900px]/ev:w-[360px]",
          INK_VAR,
        )}
      >
        <FoilNumeral className="h-auto w-full" />
      </div>
    );
  }
  return null;
}

const DIVIDERS: Record<DividerOrnamentKey, ComponentType<{ className?: string }>> = {
  line: Line,
  floral: Floral,
  dots: Dots,
  heart: Heart,
  olive_sprig: OliveSprig,
  squiggle: Squiggle,
  deco_diamond: DecoDiamond,
  wave: Wave,
  sparkle_rule: SparkleRule,
};

/** Ornament between blocks. */
export function DividerOrnament({ divider }: { divider: unknown }) {
  const key = dividerOrnamentKey(divider);
  if (!key) return null;
  const Svg = DIVIDERS[key];
  return (
    <div aria-hidden="true" className="ev-orn flex justify-center py-[30px] [--ink:var(--ev-accent-ink)]">
      <Svg className={cn("h-auto", key === "line" || key === "dots" ? "w-[120px]" : "w-[150px]")} />
    </div>
  );
}

const BADGES: Record<BadgeOrnamentKey, { Svg: ComponentType<{ className?: string }>; box: string; text: string }> = {
  starburst_sticker: {
    Svg: StarburstSticker,
    box: "-top-5 right-3.5 size-[66px] rotate-12",
    text: "pt-0.5 text-sm text-(--ev-text) [font-family:var(--ev-font-heading)]",
  },
  wax_seal: {
    Svg: WaxSeal,
    box: "-top-5 right-[18px] size-16 -rotate-[8deg]",
    text: "text-[15px] italic text-black/40 [text-shadow:0_1px_0_rgb(255_255_255/.22)] [font-family:var(--ev-font-heading)]",
  },
  foil_seal: {
    Svg: FoilSeal,
    box: "-top-5 left-1/2 h-[72px] w-14 -translate-x-1/2",
    text: "",
  },
};

/**
 * A sticker, wax seal or foil seal laid over the corner of the RSVP section
 * (the parent must be `relative`). The starburst always says "Yay!"; the wax
 * seal presses in the hero badge text.
 */
export function BadgeOrnament({ badge, text }: { badge: unknown; text: unknown }) {
  const key = badgeOrnamentKey(badge);
  if (!key) return null;
  const { Svg, box, text: textClass } = BADGES[key];
  const label = key === "starburst_sticker" ? "Yay!" : key === "wax_seal" ? sanitizeBadge(text) : "";
  return (
    <div
      aria-hidden="true"
      className={cn("ev-orn ev-badge pointer-events-none absolute z-[2] [--ink:var(--ev-accent-ink)]", box)}
    >
      <Svg className="size-full" />
      {label && <span className={cn("absolute inset-0 grid place-items-center", textClass)}>{label}</span>}
    </div>
  );
}
