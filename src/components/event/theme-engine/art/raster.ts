import { createElement, type ReactElement } from "react";

import type { ArtProps } from "./registry.ts";

/**
 * A bundled raster band across the top of the page (placement `top` only).
 * `src` is a constant same-origin file under `public/`, never user input.
 * It scales with the page up to 1280px wide, then stays centred with its side
 * edges feathered so it never shows a hard cut. Not animated.
 */
export function makeRasterTop(spec: { src: string; width: number; height: number }): (props: ArtProps) => ReactElement | null {
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
          className: "block h-auto w-full mask-b-from-50% @min-[1280px]/ev:mask-x-from-85%",
        }),
      ),
    );
  };
}
