import type { ComponentType } from "react";

import { makeArt } from "./layout.ts";
import * as balloons from "./shapes/balloons.ts";
import * as botanicalWash from "./shapes/botanical_wash.ts";
import * as clouds from "./shapes/clouds.ts";
import * as confetti from "./shapes/confetti.ts";
import * as daisies from "./shapes/daisies.ts";
import * as decoFans from "./shapes/deco_fans.ts";
import * as mirrorBall from "./shapes/mirror_ball.ts";
import * as oliveBranches from "./shapes/olive_branches.ts";
import * as openDoorPlants from "./shapes/open_door_plants.ts";
import * as printersCorners from "./shapes/printers_corners.ts";
import * as risoShapes from "./shapes/riso_shapes.ts";
import * as sparkles from "./shapes/sparkles.ts";
import * as steppedArches from "./shapes/stepped_arches.ts";
import * as terrazzoChips from "./shapes/terrazzo_chips.ts";

/**
 * Props every art component receives from the layer renderer. All values
 * have already been validated: `colors` are `#RRGGBB`, `placement` and
 * `density` are plain strings the component maps through its own typed
 * lookup (an unknown value must render nothing).
 */
export type ArtProps = {
  /** One of the placements the manifest allows for this art key. */
  placement: string;
  /** Resolved palette colours, `#RRGGBB`. Empty when the art is painted with foil. */
  colors: readonly string[];
  /** `"foil"`: paint with `url(#ev-foil-grad)` / `var(--ev-foil)` instead of `colors`. */
  paint?: "foil";
  density?: string;
  /** Which box the layer is rendered in: the whole page or the hero. */
  region: "page" | "hero";
};

/**
 * Art components by registry key (mirrors `artRegistry` in the Go
 * `theme_registry.go`; `art.test.mts` pins the key set and placements).
 * Static inline SVG Server Components only: no SVG filters, no foreign objects,
 * scripts or runtime randomness. An unknown key renders nothing.
 *
 * Sizes follow `design/src/v2/preview.js` (`CORNER_SIZE`): phone width, then
 * from 900px of the `ev` container the desktop width. Text-column clearance
 * for these pieces lives in `../ornament-keys.ts` (`artClearance`).
 */
export const ART: Record<string, ComponentType<ArtProps>> = {
  olive_branches: makeArt({
    placements: ["corners", "top_corners", "bottom_corners"],
    corner: {
      shape: oliveBranches.main,
      big: "w-[min(64cqi,250px)] @min-[900px]/ev:w-[min(22cqi,290px)]",
      small: "w-[min(40cqi,150px)] @min-[900px]/ev:w-[min(16cqi,190px)]",
    },
  }),
  botanical_wash: makeArt({
    placements: ["corners", "top_corners"],
    corner: {
      shape: botanicalWash.main,
      big: "w-[min(56cqi,220px)] @min-[900px]/ev:w-[min(28cqi,340px)]",
      small: "w-[min(46cqi,180px)] @min-[900px]/ev:w-[min(22cqi,270px)]",
    },
  }),
  confetti: makeArt({
    placements: ["hero", "edges", "scatter"],
    hero: confetti.main,
    edges: confetti.edges,
    scatter: { shape: confetti.scatter },
  }),
  balloons: makeArt({
    placements: ["hero_top", "top_corners"],
    heroTop: { shape: balloons.main, width: "w-[min(100%,560px)]" },
    corner: {
      shape: balloons.topCorners,
      big: "w-[min(40cqi,160px)] @min-[900px]/ev:w-[200px]",
      small: "w-[min(34cqi,130px)] @min-[900px]/ev:w-[170px]",
    },
  }),
  stepped_arches: makeArt({ placements: ["hero"], hero: steppedArches.main }),
  deco_fans: makeArt({
    placements: ["bottom_corners", "corners"],
    corner: {
      shape: decoFans.main,
      anchor: "bl",
      big: "w-[min(31cqi,120px)] @min-[900px]/ev:w-[150px]",
      small: "w-[min(31cqi,120px)] @min-[900px]/ev:w-[150px]",
    },
  }),
  clouds: makeArt({
    placements: ["top", "scatter"],
    top: clouds.main,
    scatter: { shape: clouds.scatter },
  }),
  open_door_plants: makeArt({
    placements: ["hero", "bottom_corners"],
    hero: openDoorPlants.main,
    corner: {
      shape: openDoorPlants.bottomCorners,
      anchor: "bl",
      big: "w-[min(40cqi,150px)] @min-[900px]/ev:w-[min(17cqi,210px)]",
      small: "w-[min(40cqi,150px)] @min-[900px]/ev:w-[min(17cqi,210px)]",
    },
  }),
  terrazzo_chips: makeArt({
    placements: ["scatter", "edges"],
    scatter: { shape: terrazzoChips.main, surface: true },
    edges: terrazzoChips.edges,
  }),
  riso_shapes: makeArt({
    placements: ["corners", "scatter"],
    scatter: { shape: risoShapes.scatter },
    corner: {
      shape: risoShapes.main,
      big: "w-[min(56cqi,220px)] @min-[900px]/ev:w-[min(26cqi,300px)]",
      small: "w-[min(40cqi,160px)] @min-[900px]/ev:w-[min(20cqi,240px)]",
    },
  }),
  mirror_ball: makeArt({
    placements: ["hero_top"],
    heroTop: { shape: mirrorBall.main, width: "w-[min(100%,390px)]" },
    scopedId: "ev-mb-clip",
  }),
  sparkles: makeArt({
    placements: ["scatter", "hero"],
    scatter: { shape: sparkles.main },
    hero: sparkles.hero,
  }),
  printers_corners: makeArt({
    placements: ["corners"],
    corner: {
      shape: printersCorners.main,
      big: "w-[84px] @min-[900px]/ev:w-[110px]",
      small: "w-[84px] @min-[900px]/ev:w-[110px]",
    },
  }),
  daisies: makeArt({
    placements: ["corners", "edges"],
    edges: daisies.edges,
    corner: {
      shape: daisies.main,
      big: "w-[min(42cqi,170px)] @min-[900px]/ev:w-[min(20cqi,220px)]",
      small: "w-[min(34cqi,130px)] @min-[900px]/ev:w-[min(16cqi,180px)]",
    },
  }),
};
