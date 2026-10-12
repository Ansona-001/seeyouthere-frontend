import { createElement, useId, type CSSProperties, type ReactElement } from "react";

import { ownKey, safeHexList } from "../safe.ts";
import type { ArtProps } from "./registry.ts";
import { svgEl, viewSize, type IdScope, type SvgNode } from "./svg.ts";

type Corner = "tl" | "tr" | "bl" | "br";

/** How one registry key is drawn and placed. Every class string is a literal so Tailwind sees it. */
export type ArtSpec = {
  /** The placements the backend registry allows for this key (a placement outside it renders nothing). */
  placements: readonly string[];
  /** One piece mirrored into the corners (`corners`, `top_corners`, `bottom_corners`). */
  corner?: {
    shape: SvgNode;
    /** Where the piece is drawn: the top-left (default) or the bottom-left corner. */
    anchor?: "bl";
    /** Width classes for the big copy (TL and BR) and the small copy (TR and BL), phone then desktop. */
    big: string;
    small: string;
  };
  /** Fills the hero box, capped at 720px, centred. */
  hero?: SvgNode;
  /** Top of the hero, centred; `width` is a width class. */
  heroTop?: { shape: SvgNode; width: string };
  /** A band across the top: one copy on a phone, two (the right one mirrored) from 900px. */
  top?: SvgNode;
  /** A 56px strip tiled vertically down both sides. */
  edges?: SvgNode;
  /** A tile repeated over the page, or (unless `surface`) over two side gutters from 900px. */
  scatter?: { shape: SvgNode; surface?: boolean };
  /** An `id` the drawing defines and references, made unique per mount. */
  scopedId?: string;
};

const DENSITIES = { sparse: 0, normal: 0, dense: 0 } as const;
const PLACEMENT_KINDS = {
  corners: ["tl", "tr", "br", "bl"],
  top_corners: ["tl", "tr"],
  bottom_corners: ["bl", "br"],
} as const satisfies Record<string, readonly Corner[]>;

/** Corner position plus the flip that turns a piece drawn in `native` into the `at` corner. */
function cornerClass(at: Corner, native: "tl" | "bl"): string {
  const pos = { tl: "top-0 left-0", tr: "top-0 right-0", bl: "bottom-0 left-0", br: "right-0 bottom-0" }[at];
  const flipX = at.endsWith("r");
  const flipY = native[0] !== at[0];
  return `${pos} ${flipX && flipY ? "-scale-100" : flipX ? "-scale-x-100" : flipY ? "-scale-y-100" : ""}`.trimEnd();
}

/** `--a1..--a8`: the layer colours cycled, or the foil gradient. No colours and no foil leaves the drawing's own fallbacks. */
export function artVars(colors: readonly string[], paint: "foil" | undefined): CSSProperties {
  const safe = paint === "foil" ? [] : (safeHexList(colors, 0, 8) ?? []);
  if (paint !== "foil" && safe.length === 0) return {};
  const vars: Record<string, string> = {};
  for (let n = 1; n <= 8; n++) vars[`--a${n}`] = paint === "foil" ? "url(#ev-foil-grad)" : safe[(n - 1) % safe.length];
  return vars as CSSProperties;
}

const div = (props: Record<string, unknown>, ...children: ReactElement[]) => createElement("div", props, ...children);

/** A pattern-filled rect, so one small drawing tiles over an arbitrary box. `patternId` must be unique in the document. */
function tile(shape: SvgNode, patternId: string, className: string): ReactElement {
  const [w, h] = viewSize(shape);
  const piece = svgEl(shape, { width: w, height: h });
  return createElement(
    "svg",
    { className, "aria-hidden": "true", focusable: "false", width: "100%", height: "100%" },
    createElement("defs", null, createElement("pattern", { id: patternId, patternUnits: "userSpaceOnUse", width: w, height: h }, piece)),
    createElement("rect", { width: "100%", height: "100%", fill: `url(#${patternId})` }),
  );
}

const FILL = "block h-auto w-full overflow-visible";

/** Builds the Server Component for one registry key. */
export function makeArt(spec: ArtSpec): (props: ArtProps) => ReactElement | null {
  const allowed = Object.fromEntries(spec.placements.map((p) => [p, 0]));
  return function Art({ placement, colors, paint, density }: ArtProps) {
    // Hooks run on every render; the id is only used by the drawings that need it.
    const uid = useId().replace(/[^A-Za-z0-9_-]/g, "");
    const place = ownKey(allowed, placement);
    if (!place) return null;

    const scope: IdScope | undefined = spec.scopedId ? [spec.scopedId, `${spec.scopedId}-${uid}`] : undefined;
    const kids: ReactElement[] = [];

    if (place === "corners" || place === "top_corners" || place === "bottom_corners") {
      const c = spec.corner;
      if (!c) return null;
      const native = c.anchor ?? "tl";
      for (const at of PLACEMENT_KINDS[place]) {
        // TL and BR are the big copies; a bottom pair drawn from the bottom-left puts the big one on the left.
        const big = native === "bl" && place === "bottom_corners" ? at === "bl" : at === "tl" || at === "br";
        kids.push(div({ key: at, className: `absolute ${cornerClass(at, native)} ${big ? c.big : c.small}` }, svgEl(c.shape, { className: FILL })));
      }
    } else if (place === "hero" && spec.hero) {
      kids.push(div({ key: place, className: "absolute inset-y-0 left-1/2 w-[min(100%,720px)] -translate-x-1/2" }, svgEl(spec.hero, { className: "block h-full w-full overflow-visible" })));
    } else if (place === "hero_top" && spec.heroTop) {
      kids.push(div({ key: place, className: `absolute top-0 left-1/2 -translate-x-1/2 ${spec.heroTop.width}` }, svgEl(spec.heroTop.shape, { className: FILL }, scope)));
    } else if (place === "top" && spec.top) {
      kids.push(
        div(
          { key: place, className: "absolute inset-x-0 top-0 @min-[900px]/ev:flex @min-[900px]/ev:justify-between" },
          div({ className: "w-full @min-[900px]/ev:w-[min(46%,600px)]" }, svgEl(spec.top, { className: FILL })),
          div({ className: "hidden @min-[900px]/ev:block @min-[900px]/ev:w-[min(46%,600px)] -scale-x-100" }, svgEl(spec.top, { className: FILL })),
        ),
      );
    } else if (place === "edges" && spec.edges) {
      const strip = "absolute inset-y-0 w-14";
      kids.push(
        div({ key: "l", className: `${strip} left-0` }, tile(spec.edges, `ev-t-${uid}-l`, "absolute inset-0 h-full w-full")),
        div({ key: "r", className: `${strip} right-0 -scale-x-100` }, tile(spec.edges, `ev-t-${uid}-r`, "absolute inset-0 h-full w-full")),
      );
    } else if (place === "scatter" && spec.scatter) {
      const { shape, surface } = spec.scatter;
      if (surface) {
        kids.push(div({ key: "s", className: "absolute inset-0" }, tile(shape, `ev-t-${uid}`, "absolute inset-0 h-full w-full")));
      } else {
        kids.push(
          div({ key: "l", className: "absolute inset-0 overflow-hidden @min-[900px]/ev:right-auto @min-[900px]/ev:w-[min(13%,180px)]" }, tile(shape, `ev-t-${uid}-l`, "absolute inset-0 h-full w-full")),
          div({ key: "r", className: "absolute inset-0 hidden overflow-hidden @min-[900px]/ev:left-auto @min-[900px]/ev:block @min-[900px]/ev:w-[min(13%,180px)] @min-[900px]/ev:-scale-x-100" }, tile(shape, `ev-t-${uid}-r`, "absolute inset-0 h-full w-full")),
        );
      }
    } else {
      return null;
    }

    return div(
      { className: "absolute inset-0", "aria-hidden": "true", "data-ev-density": ownKey(DENSITIES, density) ?? "normal", style: artVars(colors, paint) },
      ...kids,
    );
  };
}
