import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import type { FontKey, HeroBlock, MediaMap, Theme } from "@/lib/api-types";
import { SCRIPT_FONTS } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { ART } from "./art/registry";
import { foilGradient } from "./foil";
import { LayerStack } from "./layers";
import { artClearance, heroOrnamentKey, sanitizeBadge, splitTitle } from "./ornament-keys";
import { HeroOrnament, NumeralBackdrop } from "./ornaments";
import { ownKey } from "./safe";

const HERO_INK = "text-[color:var(--ev-hero-ink,var(--ev-accent-ink))]";

const HERO_STYLES = {
  full_bleed: 0,
  framed: 0,
  text_only: 0,
  spotlight: 0,
  color_block: 0,
} as const;

/** Title face per heading font; sizes use container-query units so the editor's narrow pane behaves like a phone. */
const TITLE_SIZE = "text-[clamp(2rem,12.6cqi,3.125rem)] @min-[900px]/ev:text-[64px]";
const TITLE_FONT: Partial<Record<FontKey, string>> = {
  bodoni_moda: "font-medium italic tracking-[-.012em]",
  cormorant_garamond: "font-medium italic tracking-[-.01em] text-[clamp(2.25rem,15cqi,3.625rem)]",
  fraunces: "font-semibold tracking-[-.02em] [font-variation-settings:'SOFT'_100,'WONK'_1]",
  bricolage_grotesque: "font-extrabold tracking-[-.035em] leading-[.98] text-[clamp(2rem,12.4cqi,3rem)]",
  dm_serif_display: "font-normal tracking-[-.01em] leading-none text-[clamp(2rem,13.4cqi,3.25rem)]",
  limelight: "font-normal tracking-[.06em] leading-[1.02]",
  bagel_fat_one: "font-normal",
};

/** Kicker (accent font) style by the kind of face the accent font is. */
const ACCENT_KIND: Partial<Record<FontKey, "serif" | "sans" | "display">> = {
  lora: "serif",
  cormorant_garamond: "serif",
  fraunces: "serif",
  dm_serif_display: "serif",
  playfair_display: "serif",
  bodoni_moda: "serif",
  bagel_fat_one: "display",
  limelight: "display",
};
const KICKER_CLASS = {
  script: "text-[30px] leading-[1.15]",
  serif: "text-[19px] italic",
  display: "pl-[.2em] text-[17px] tracking-[.2em] uppercase",
  sans: "pl-[.3em] text-[11.5px] font-semibold tracking-[.3em] uppercase",
} as const;

const SANS_BODY: ReadonlySet<FontKey> = new Set(["figtree", "montserrat", "josefin_sans", "bricolage_grotesque"]);

/** Numeral size by length (1-4 characters): `[phone, wide]`. Longer badges shrink so they never overflow. */
const STICKER_NUM = [
  "text-[min(230px,58cqi)] @min-[900px]/ev:text-[320px]",
  "text-[min(176px,44cqi)] @min-[900px]/ev:text-[240px]",
  "text-[min(124px,32cqi)] @min-[900px]/ev:text-[170px]",
  "text-[min(96px,25cqi)] @min-[900px]/ev:text-[130px]",
] as const;
const FOIL_NUM = [
  "text-[min(196px,50cqi)] @min-[900px]/ev:text-[250px]",
  "text-[min(150px,38cqi)] @min-[900px]/ev:text-[190px]",
  "text-[min(108px,28cqi)] @min-[900px]/ev:text-[136px]",
  "text-[min(84px,22cqi)] @min-[900px]/ev:text-[106px]",
] as const;

function numeralScale(len: number): 0 | 1 | 2 | 3 {
  return len <= 1 ? 0 : len === 2 ? 1 : len === 3 ? 2 : 3;
}

function accentKind(accent: FontKey): keyof typeof KICKER_CLASS {
  if (SCRIPT_FONTS.has(accent)) return "script";
  return ACCENT_KIND[accent] ?? "sans";
}

/** The title as real text; `&` is set in the accent font when the theme asks for it. */
function TitleText({
  title,
  script,
  foil,
  primaryFoil,
}: {
  title: string;
  script: boolean;
  foil: boolean;
  primaryFoil: boolean;
}) {
  const parts = script ? splitTitle(title) : null;
  if (!parts || !parts.some((p) => p.amp)) return <>{title}</>;
  // "Amelia & Theo": names on their own lines with the ampersand between them.
  const stacked = parts.length === 3 && parts[1].amp;
  const firstAmp = parts.findIndex((p) => p.amp);
  return (
    <>
      {parts.map((part, i) => {
        if (!part.amp) {
          return (
            <span key={i} className={stacked ? "block" : undefined}>
              {part.text}
              {!stacked && i < parts.length - 1 ? " " : null}
            </span>
          );
        }
        return (
          <span
            key={i}
            data-ev-foil-text={foil && primaryFoil && i === firstAmp ? "" : undefined}
            className={cn(
              "[font-family:var(--ev-font-accent)] font-normal not-italic tracking-normal",
              stacked ? "my-0.5 block text-[1.05em] leading-[1.05]" : "px-[.1em]",
              foil ? "ev-foil-text" : HERO_INK,
            )}
          >
            &amp;
          </span>
        );
      })}
    </>
  );
}

function Portrait({ image, alt, ring }: { image: { src: string }; alt: string; ring: string }) {
  return (
    <div className={cn("mb-6 size-40 overflow-hidden rounded-full ring-2", ring)}>
      <Image src={image.src} alt={alt} width={320} height={320} className="size-full object-cover" />
    </div>
  );
}

/**
 * The hero of a schema-2 event. Owns the hero-region layer stack (colour block,
 * hero patterns and art), chooses the layout by `hero_style`, and sets the
 * ornament (wreath, rule, ring, cloud, doorway, numerals), kicker, title with
 * its script ampersand, and subtitle. Everything the author typed renders as
 * React text. `color_block` sets text in `accent_text` on the accent block and
 * never uses the muted colour, which is not contrast-checked against it.
 */
export function HeroV2({ block, theme, media }: { block: HeroBlock; theme: Theme; media: MediaMap }) {
  const image = block.image ? media[block.image.media_id] : undefined;
  const alt = block.image?.alt ?? "";
  const ornament = heroOrnamentKey(theme.ornament?.hero);
  const badge = sanitizeBadge(block.badge);
  const foil = foilGradient(theme.foil) !== null;
  const wantStyle = ownKey(HERO_STYLES, theme.hero_style) ?? "text_only";
  // A colour block with no block layer would leave accent_text on the page background.
  const hasBlock = theme.layers?.some((l) => l.kind === "block") ?? false;
  const style = wantStyle === "color_block" && !hasBlock ? "text_only" : wantStyle;
  const onBlock = style === "color_block";
  const fullBleed = style === "full_bleed" && image;
  const split = theme.layout === "split";

  const headingFont = theme.fonts.heading;
  const accentFont = theme.fonts.accent || headingFont;
  const script = theme.ornament?.ampersand === "script";
  const numeral = ornament === "sticker_numeral" || ornament === "foil_numeral";
  const showNum = numeral && badge !== "";
  const scale = numeralScale(Array.from(badge).length);

  const clearance = artClearance(theme.layers, (key) => Object.hasOwn(ART, key));
  const pt = clearance.reserve || clearance.top;
  const ptWide = clearance.reserve ? clearance.reserve + 40 : clearance.top ? clearance.top + 30 : 0;
  const vars = (pt || ptWide ? { "--ev-pt": `${pt}px`, "--ev-ptw": `${ptWide}px` } : undefined) as
    CSSProperties | undefined;

  const kickerClass = KICKER_CLASS[accentKind(accentFont)];
  const subSans = SANS_BODY.has(theme.fonts.body) && !onBlock;

  const content: ReactNode = (
    <div className="relative mx-auto w-full max-w-[560px] @min-[900px]/ev:max-w-[820px]">
      <HeroOrnament ornament={ornament} badge={badge} foil={foil} />
      {block.kicker && (
        <p
          className={cn(
            "[font-family:var(--ev-font-accent)]",
            onBlock || fullBleed ? "" : HERO_INK,
            fullBleed && "text-white/90",
            kickerClass,
          )}
        >
          {block.kicker}
        </p>
      )}
      <div className="relative">
        <NumeralBackdrop ornament={ornament} />
        <h1
          className={cn(
            "mt-3.5 text-balance [font-family:var(--ev-font-heading)]",
            TITLE_SIZE,
            "leading-[1.04] font-medium",
            TITLE_FONT[headingFont],
            fullBleed ? "text-white" : onBlock ? "text-(--ev-accent-text)" : "text-(--ev-text)",
          )}
        >
          {showNum ? (
            <>
              <span
                className={cn(
                  "block",
                  ornament === "sticker_numeral"
                    ? "text-[32px] leading-none text-(--ev-accent-text)"
                    : "pl-[.16em] text-[36px] tracking-[.16em]",
                )}
              >
                {block.title}
              </span>{" "}
              {ornament === "sticker_numeral" ? (
                <span
                  className={cn(
                    "ev-num mt-2.5 block -rotate-6 leading-[.84] [paint-order:stroke_fill] [-webkit-text-stroke:.04em_var(--ev-accent-text)] [text-shadow:0_7px_0_rgb(0_0_0/.28),0_22px_30px_rgb(0_0_0/.3)]",
                    "text-[color:var(--ev-art-1,var(--ev-accent-ink))]",
                    STICKER_NUM[scale],
                  )}
                >
                  {badge}
                </span>
              ) : (
                <span
                  data-ev-foil-text={foil ? "" : undefined}
                  className={cn(
                    "mt-2 block leading-[.84] tracking-[-.02em]",
                    foil ? "ev-foil-text" : HERO_INK,
                    FOIL_NUM[scale],
                  )}
                >
                  {badge}
                </span>
              )}
            </>
          ) : (
            <TitleText title={block.title} script={script} foil={foil} primaryFoil={ornament !== "foil_numeral"} />
          )}
        </h1>
      </div>
      {block.subtitle && (
        <p
          className={cn(
            "mx-auto mt-4 text-[15px] text-balance",
            fullBleed ? "max-w-xl text-white/90" : onBlock ? "text-(--ev-accent-text)" : "text-(--ev-muted)",
            onBlock && "text-[19px] font-extrabold",
            subSans && "text-[11.5px] leading-8 font-medium tracking-[.24em] uppercase",
            ornament === "foil_numeral" && "mt-[52px] max-w-[300px]",
          )}
        >
          {block.subtitle}
        </p>
      )}
    </div>
  );

  if (fullBleed && image) {
    return (
      <div className="relative isolate flex min-h-[70svh] w-full items-end overflow-hidden @min-[900px]/ev:h-full @min-[900px]/ev:min-h-0">
        <LayerStack layers={theme.layers} region="hero" foil={theme.foil} />
        <Image src={image.src} alt={alt} fill sizes="100vw" priority className="-z-10 object-cover" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/65 via-black/10 to-transparent"
        />
        <div className="relative w-full px-6 pb-10 text-left @min-[640px]/ev:px-10 @min-[640px]/ev:pb-16">
          {content}
        </div>
      </div>
    );
  }

  const portrait =
    image && (style === "spotlight" || onBlock) ? (
      <Portrait image={image} alt={alt} ring={onBlock ? "ring-(--ev-accent-text)/60" : "ring-(--ev-accent)/40"} />
    ) : null;
  const framed =
    style === "framed" && image ? (
      <div className="mb-6 aspect-4/5 w-full max-w-xs overflow-hidden rounded-2xl ring-1 ring-(--ev-accent)/20 @min-[640px]/ev:max-w-sm">
        <Image src={image.src} alt={alt} width={480} height={600} className="size-full object-cover" />
      </div>
    ) : null;

  return (
    <div
      data-ev-hero={style}
      style={vars}
      className={cn(
        "relative isolate flex flex-col items-center px-[22px] text-center",
        style === "spotlight" ? "min-h-[85svh] justify-center py-14" : "pb-2",
        style === "spotlight"
          ? ""
          : onBlock
            ? "pt-[max(3.5rem,var(--ev-pt,0px))] pb-[84px]"
            : "pt-[max(4rem,var(--ev-pt,0px))]",
        !split && "@min-[900px]/ev:px-12",
        !split &&
          style !== "spotlight" &&
          (onBlock
            ? "@min-[900px]/ev:pt-[max(5rem,var(--ev-ptw,0px))]"
            : "@min-[900px]/ev:pt-[max(6rem,var(--ev-ptw,0px))]"),
        split && "@min-[900px]/ev:h-full @min-[900px]/ev:justify-center @min-[900px]/ev:px-12 @min-[900px]/ev:py-20",
        onBlock && "mb-[34px] text-(--ev-accent-text)",
        // The colour block runs edge to edge even inside the centred column.
        onBlock && theme.layout === "centered" && "ml-[calc(50%-50cqi)] w-[100cqi] max-w-none",
      )}
    >
      <LayerStack layers={theme.layers} region="hero" foil={theme.foil} />
      {portrait}
      {framed}
      {content}
    </div>
  );
}
