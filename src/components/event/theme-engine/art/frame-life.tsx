import type { CSSProperties } from "react";

import { ownKey } from "../safe.ts";

/**
 * The life drawn over a framed theme's first screen, after the invitation film made from the same painting: the brass
 * lamps flicker, gold dust rises, mist drifts along the tree line, light glints on the pond and a soft
 * beam sweeps across now and then. Pure CSS (globals.css, `.ev-life`), off under `prefers-reduced-motion`, where only
 * a still glow on the lamps remains. Every position is a constant for one painting, never user input.
 */

/** A point on the painting: CSS offsets inside the layer (`left` always, then `top` or `bottom`). */
type Spot = { left: string; top?: string; bottom?: string };

type Scene = {
  /** Lamp flames, glowing. */
  lamps: Spot[];
  /** Width of a lamp's glow. */
  glow: string;
  /** Where the pond lies: glints are scattered between `from` and `to` (percent of the width) at this height. */
  pond: { from: number; to: number; top?: string; bottom?: string };
  /** The height of the tree line the mist drifts along. */
  mist: { top?: string; bottom?: string };
};

/**
 * Temple Pond. Portrait: the card, where the arch band (736 px wide) sits at the top and the temple band at the bottom,
 * so heights are shares of the card width (cqi). Wide: the landscape painting as drawn by the cover box in event-view.
 */
const SCENES: Record<string, { portrait: Scene; wide: Scene }> = {
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

export function FrameLife({ art, wide, className }: { art: string; wide: boolean; className?: string }) {
  const key = ownKey(SCENES, art);
  if (!key) return null;
  const scene = SCENES[key][wide ? "wide" : "portrait"];
  return (
    <div aria-hidden="true" className={`ev-life pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <div className="ev-life-mist" style={scene.mist} />
      <div className="ev-life-mist ev-life-mist-2" style={scene.mist} />
      {scene.lamps.map((spot, i) => (
        <div
          key={i}
          className="ev-life-lamp"
          // Centred on the flame: a spot measured from the bottom moves down by half the glow, not up.
          style={{ ...spot, width: scene.glow, translate: spot.bottom ? "-50% 50%" : "-50% -50%", "--i": i } as CSSProperties}
        />
      ))}
      {GLINTS.map((g, i) => (
        <div
          key={i}
          className="ev-life-glint"
          style={
            {
              left: `${(scene.pond.from + g * (scene.pond.to - scene.pond.from)).toFixed(1)}%`,
              top: scene.pond.top,
              bottom: scene.pond.bottom,
              "--i": i,
            } as CSSProperties
          }
        />
      ))}
      <div className="ev-life-beam" />
      {MOTES.map((m, i) => (
        <div key={i} className="ev-life-col" style={{ left: m.left, "--d": m.dur, "--at": m.at } as CSSProperties}>
          <span className="ev-life-mote" />
        </div>
      ))}
    </div>
  );
}
