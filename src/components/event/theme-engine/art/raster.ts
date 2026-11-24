import { createElement, type ReactElement } from "react";

import type { ArtProps } from "./registry.ts";

/** Vertical strips a hanging band is split into; globals.css defines one `.ev-hang:nth-child()` rule per strip. */
export const HANG_STRIPS = 8;
/** A hanging band is drawn at least this wide (px), cropped at the sides on narrower pages. */
export const HANG_MIN_WIDTH = 600;

/**
 * A bundled raster band across the top of the page (placement `top` only).
 * `src` is a constant same-origin file under `public/`, never user input.
 * It scales with the page up to 1280px wide, then stays centred with its side
 * edges feathered so it never shows a hard cut. `multiply` is for art painted on a white ground:
 * the white drops into the paper colour instead of showing as a box. `hang` is for art hanging from the top edge
 * (strands of flowers): the band is drawn as HANG_STRIPS copies of the same file, each showing one vertical strip
 * that cross-fades into its neighbours (globals.css, `.ev-hang`). Under the theme's `sway` motion every strip bends
 * from the top edge on its own timing, so the strands move separately; otherwise the copies line up into one image.
 * The blend and the fades sit on the wrapper so the strips composite with each other before multiplying into the paper.
 */
export function makeRasterTop(spec: {
  src: string;
  width: number;
  height: number;
  solid?: boolean;
  noFade?: boolean;
  multiply?: boolean;
  hang?: boolean;
}): (props: ArtProps) => ReactElement | null {
  const blend = spec.multiply ? "mix-blend-multiply " : "";
  const fade = `${spec.noFade ? "" : spec.solid ? "mask-b-from-75%" : "mask-b-from-50%"} @min-[1280px]/ev:mask-x-from-85%`;
  const band = "absolute top-0 left-1/2 w-full -translate-x-1/2 @min-[1280px]/ev:w-[1280px]";
  const img = (className: string, key?: number) =>
    createElement("img", {
      key,
      src: spec.src,
      alt: "",
      width: spec.width,
      height: spec.height,
      decoding: "async",
      loading: "eager",
      fetchPriority: spec.solid ? "high" : undefined,
      className,
    });
  return function RasterTop({ placement }: ArtProps) {
    if (placement !== "top") return null;
    return createElement(
      "div",
      { className: `absolute inset-0${spec.hang ? " overflow-hidden" : ""}`, "aria-hidden": "true" },
      spec.hang
        ? createElement(
            "div",
            // Never narrower than HANG_MIN_WIDTH, so on a phone the strands keep their length and the sides crop.
            // Written out in full so Tailwind generates it; the test keeps it in step with HANG_MIN_WIDTH.
            { className: `${band.replace("w-full", "w-[max(100%,600px)]")} isolate ${blend}${fade}` },
            // The first strip stays in flow to give the band its height; the rest stack over it.
            Array.from({ length: HANG_STRIPS }, (_, i) =>
              img(`ev-hang block h-auto w-full${i === 0 ? "" : " absolute top-0 left-0"}`, i),
            ),
          )
        : createElement("div", { className: band }, img(`block h-auto w-full ${blend}${fade}`)),
    );
  };
}

/**
 * One bundled painting covering the whole page (placement `page` only), cropped to fill it, for the framed themes
 * whose first screen is a single portrait picture (../ornament-keys.ts, FRAMED_ART). `src` is a constant same-origin
 * file under `public/`, never user input. Not animated itself; art/frame-life.tsx draws the life over it.
 */
export function makeRasterCover(spec: { src: string; width: number; height: number }): (props: ArtProps) => ReactElement | null {
  return function RasterCover({ placement }: ArtProps) {
    if (placement !== "page") return null;
    return createElement(
      "div",
      { className: "absolute inset-0", "aria-hidden": "true" },
      createElement("img", {
        src: spec.src,
        alt: "",
        width: spec.width,
        height: spec.height,
        decoding: "async",
        loading: "eager",
        fetchPriority: "high",
        className: "block size-full object-cover",
      }),
    );
  };
}

/**
 * A bundled raster page background (placement `page` only): a tiled watercolour wash with painted
 * leaf band mirrored along the bottom edge of the page (the top edge belongs to the `top` band). Every `src` is a constant
 * same-origin file under `public/`, never user input. Not animated.
 */
export function makeRasterPage(spec: {
  /** Optional tiled wash image behind the page. */
  wash?: string;
  /** `flip: false` keeps the image upright (art that grows up from the bottom edge); the default mirrors a top band. */
  bottom: { src: string; width: number; height: number; flip?: boolean };
  /**
   * Optional pillar running the full height of the page on the left (and mirrored on the right; the text column keeps
   * clear of it through the key's `side` clearance in ../ornament-keys.ts): a short slice of a plain shaft cut from the top band's left edge, stretched to
   * the page height (its grooves run vertically, so the stretch reads as a longer shaft). Its width is a fixed share of
   * the band width so it lines up with the pillars painted into the top and bottom bands, which cover its ends.
   */
  sides?: { src: string; width: number; height: number };
}): (props: ArtProps) => ReactElement | null {
  const end = "absolute left-1/2 block h-auto w-full -translate-x-1/2 @min-[1280px]/ev:w-[1280px] @min-[1280px]/ev:mask-x-from-85%";
  // Written out in full so Tailwind generates them. The shaft is 72 of the band's 736px (9.78%, at most 125px of a
  // 1280px band) and starts 14px (1.9%, at most 24px) in from the band's edge, where the painted pillars stand.
  const side = "absolute top-0 block h-full w-[min(9.78%,125px)] object-fill";
  const pillar = (className: string) =>
    spec.sides
      ? createElement("img", {
          src: spec.sides.src,
          alt: "",
          width: spec.sides.width,
          height: spec.sides.height,
          decoding: "async",
          loading: "lazy",
          className: `${side} ${className}`,
        })
      : null;
  return function RasterPage({ placement }: ArtProps) {
    if (placement !== "page") return null;
    return createElement(
      "div",
      { className: "absolute inset-0", "aria-hidden": "true" },
      spec.wash
        ? createElement("div", {
            className: "absolute inset-0 bg-[length:100%_auto] bg-top bg-repeat-y",
            style: { backgroundImage: `url(${spec.wash})` },
          })
        : null,
      pillar("left-[calc(max(0px,calc(50%-640px))+min(1.9%,24px))]"),
      pillar("right-[calc(max(0px,calc(50%-640px))+min(1.9%,24px))] -scale-x-100"),
      createElement("img", {
        src: spec.bottom.src,
        alt: "",
        width: spec.bottom.width,
        height: spec.bottom.height,
        decoding: "async",
        loading: "lazy",
        className: `${end} bottom-0 ${spec.bottom.flip === false ? "mask-t-from-75%" : "-scale-y-100 mask-b-from-75%"}`,
      }),
    );
  };
}
