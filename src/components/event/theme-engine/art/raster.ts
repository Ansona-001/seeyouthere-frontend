import { createElement, type ReactElement } from "react";

import type { ArtProps } from "./registry.ts";

/**
 * A bundled raster band across the top of the page (placement `top` only).
 * `src` is a constant same-origin file under `public/`, never user input.
 * It scales with the page up to 1280px wide, then stays centred with its side
 * edges feathered so it never shows a hard cut. Not animated.
 */
export function makeRasterTop(spec: { src: string; width: number; height: number; solid?: boolean; noFade?: boolean }): (props: ArtProps) => ReactElement | null {
  return function RasterTop({ placement }: ArtProps) {
    if (placement !== "top") return null;
    return createElement(
      "div",
      { className: "absolute inset-0", "aria-hidden": "true" },
      createElement(
        "div",
        { className: "absolute top-0 left-1/2 w-full -translate-x-1/2 @min-[1280px]/ev:w-[1280px]" },
        createElement("img", {
          src: spec.src,
          alt: "",
          width: spec.width,
          height: spec.height,
          decoding: "async",
          loading: "eager",
          fetchPriority: spec.solid ? "high" : undefined,
          className: `block h-auto w-full ${spec.noFade ? "" : spec.solid ? "mask-b-from-75%" : "mask-b-from-50%"} @min-[1280px]/ev:mask-x-from-85%`,
        }),
      ),
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
}): (props: ArtProps) => ReactElement | null {
  const end = "absolute left-1/2 block h-auto w-full -translate-x-1/2 @min-[1280px]/ev:w-[1280px] @min-[1280px]/ev:mask-x-from-85%";
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
