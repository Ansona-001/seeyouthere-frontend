import type { CSSProperties } from "react";

import { ownKey } from "../safe.ts";

/**
 * The life drawn over a framed theme's first screen, after the invitation film made from the Temple Pond painting: lamps
 * flicker, soft halos breathe on the painting's focal points, gold dust rises, mist drifts along a tree line, light
 * glints on water and a soft beam sweeps across now and then. Pure CSS (globals.css, `.ev-life`), off under
 * `prefers-reduced-motion`, where only a still glow on the lamps and halos remains. Every position is a constant for
 * one painting, never user input.
 */

/** A point on the painting: CSS offsets inside the layer (`left` always, then `top` or `bottom`). */
type Spot = { left: string; top?: string; bottom?: string };

type Scene = {
  /**
   * The painting's own shape, when it is cropped to cover the layer (a single portrait painting): the spots are then
   * placed on a box of that shape centred over the layer, so they stay on the painting however it is cropped.
   */
  cover?: { width: number; height: number };
  /** Lamp flames, flickering. */
  lamps?: Spot[];
  /** Width of a lamp's glow. */
  glow?: string;
  /** Slow breathing halos on the painting's focal points (a deity, flowers), gold or pink. */
  halos?: { spot: Spot; size: string; pink?: boolean }[];
  /** Water or a polished floor: glints are scattered between `from` and `to` (percent of the width) at this height. */
  pond?: { from: number; to: number; top?: string; bottom?: string };
  /** The height of a tree line the mist drifts along. */
  mist?: { top?: string; bottom?: string };
  /** `false` leaves out the diagonal beam of light that sweeps across now and then (on by default). */
  beam?: false;
};

const PORTRAIT = { width: 736, height: 1308 };

/**
 * Temple Pond. Portrait: the card, where the arch band (736 px wide) sits at the top and the temple band at the bottom,
 * so heights are shares of the card width (cqi). Wide: the landscape painting as drawn by the cover box in event-view.
 * Lotus Velvet: the lotuses climb the left edge (both edges in the landscape copy, the right one mirrored).
 * Ganesha Mandapam: brass lamps hang at both sides, Ganesha sits at the top centre and the marble floor shines; it has
 * no landscape copy (event-view fades the portrait into the matching paper instead).
 */
const SCENES: Record<string, { portrait: Scene; wide?: Scene }> = {
  temple_pond_page: {
    portrait: {
      lamps: [
        { left: "21.5%", top: "42.8cqi" },
        { left: "78%", top: "42.8cqi" },
        { left: "8.2%", bottom: "38.6cqi" },
        { left: "92%", bottom: "38.6cqi" },
      ],
      glow: "26cqi",
      pond: { from: 30, to: 66, bottom: "16.8cqi" },
      mist: { bottom: "40cqi" },
    },
    wide: {
      lamps: [
        { left: "14.8%", top: "32.1%" },
        { left: "85.2%", top: "32.1%" },
        { left: "4.8%", top: "65.4%" },
        { left: "95.2%", top: "65.4%" },
      ],
      glow: "15%",
      pond: { from: 32, to: 74, top: "87%" },
      mist: { top: "62%" },
    },
  },
  lotus_velvet: {
    portrait: {
      cover: PORTRAIT,
      beam: false,
      halos: [
        { spot: { left: "14.3%", top: "15.7%" }, size: "24%", pink: true },
        { spot: { left: "26.5%", top: "48.9%" }, size: "24%", pink: true },
        { spot: { left: "31.2%", top: "71.9%" }, size: "24%", pink: true },
        { spot: { left: "18.3%", top: "84.9%" }, size: "24%", pink: true },
      ],
    },
    wide: {
      beam: false,
      halos: [
        { spot: { left: "4.5%", top: "15.7%" }, size: "8%", pink: true },
        { spot: { left: "8.4%", top: "48.9%" }, size: "8%", pink: true },
        { spot: { left: "5.8%", top: "84.9%" }, size: "8%", pink: true },
        { spot: { left: "95.5%", top: "27.9%" }, size: "8%", pink: true },
        { spot: { left: "90.1%", top: "71.9%" }, size: "8%", pink: true },
      ],
    },
  },
  ganesha_mandapam: {
    portrait: {
      cover: PORTRAIT,
      beam: false,
      lamps: [
        { left: "10.6%", top: "12.8%" },
        { left: "4.8%", top: "35%" },
        { left: "79.9%", top: "9%" },
        { left: "96.2%", top: "34.2%" },
      ],
      glow: "18%",
      halos: [{ spot: { left: "50%", top: "13.5%" }, size: "42%" }],
      pond: { from: 40, to: 88, top: "95%" },
    },
  },
};

// A fixed pseudo-random sequence, so the server and every visit draw the same particles.
function seq(n: number, salt: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  });
}

const MOTES = (() => {
  const [x, d, at] = [seq(14, 6), seq(14, 7), seq(14, 8)];
  return x.map((_, i) => ({
    left: `${(3 + x[i] * 94).toFixed(1)}%`,
    dur: `${(16 + d[i] * 12).toFixed(1)}s`,
    at: `${(-at[i] * 28).toFixed(1)}s`,
  }));
})();

const GLINTS = seq(5, 9);

// Centred on its point: a spot measured from the bottom moves down by half its size, not up.
const centre = (spot: Spot) => (spot.bottom ? "-50% 50%" : "-50% -50%");

export function FrameLife({ art, wide, className }: { art: string; wide: boolean; className?: string }) {
  const key = ownKey(SCENES, art);
  if (!key) return null;
  const scene = wide ? SCENES[key].wide : SCENES[key].portrait;
  if (!scene) return null;
  const { cover, pond } = scene;
  return (
    <div
      aria-hidden="true"
      className={`ev-life pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      style={cover ? { containerType: "size" } : undefined}
    >
      <div
        className="absolute"
        style={
          cover
            ? {
                top: "50%",
                left: "50%",
                translate: "-50% -50%",
                width: `max(100cqw, calc(100cqh * ${cover.width} / ${cover.height}))`,
                height: `max(100cqh, calc(100cqw * ${cover.height} / ${cover.width}))`,
              }
            : { inset: 0 }
        }
      >
        {scene.mist && (
          <>
            <div className="ev-life-mist" style={scene.mist} />
            <div className="ev-life-mist ev-life-mist-2" style={scene.mist} />
          </>
        )}
        {scene.halos?.map((h, i) => (
          <div
            key={`h${i}`}
            className="ev-life-halo"
            data-pink={h.pink ? "" : undefined}
            style={{ ...h.spot, width: h.size, translate: centre(h.spot), "--i": i } as CSSProperties}
          />
        ))}
        {scene.lamps?.map((spot, i) => (
          <div
            key={`l${i}`}
            className="ev-life-lamp"
            style={{ ...spot, width: scene.glow, translate: centre(spot), "--i": i } as CSSProperties}
          />
        ))}
        {pond &&
          GLINTS.map((g, i) => (
            <div
              key={`g${i}`}
              className="ev-life-glint"
              style={
                {
                  left: `${(pond.from + g * (pond.to - pond.from)).toFixed(1)}%`,
                  top: pond.top,
                  bottom: pond.bottom,
                  "--i": i,
                } as CSSProperties
              }
            />
          ))}
      </div>
      {scene.beam !== false && <div className="ev-life-beam" />}
      {MOTES.map((m, i) => (
        <div key={i} className="ev-life-col" style={{ left: m.left, "--d": m.dur, "--at": m.at } as CSSProperties}>
          <span className="ev-life-mote" />
        </div>
      ))}
    </div>
  );
}
