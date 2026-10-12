import Image from "next/image";
import { Fragment } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { ThemeLayer } from "@/lib/api-types";

import { ART } from "./art/registry";
import { foilGradient } from "./foil";
import { ownKey, safeHex, safeHexList, safeInt, safeMediaSrc, safeNumber } from "./safe";
import { isTextureKey, TEXTURE_SIZE, textureUrl } from "./textures";

type Region = "page" | "hero";
type Layer<K extends ThemeLayer["kind"]> = Extract<ThemeLayer, { kind: K }>;

/** At most this many texture layers may use a blend mode other than `normal` (compositing cost). */
const MAX_BLENDED = 3;

const BLENDS = {
  normal: "normal",
  multiply: "multiply",
  screen: "screen",
  "soft-light": "soft-light",
  overlay: "overlay",
} as const satisfies Record<string, CSSProperties["mixBlendMode"]>;

const ORIGINS = {
  center: { at: "50% 50%", band: null },
  top: { at: "50% 0%", band: "top" },
  bottom: { at: "50% 100%", band: "bottom" },
  top_left: { at: "0% 0%", band: "top" },
  top_right: { at: "100% 0%", band: "top" },
  bottom_left: { at: "0% 100%", band: "bottom" },
  bottom_right: { at: "100% 100%", band: "bottom" },
} as const;

/** Mask gradient for a pattern (`origin` is a CSS `<position>` from ORIGINS). */
const MASKS = {
  none: () => null,
  radial: (at: string) => `radial-gradient(ellipse 75% 85% at ${at}, #000 0%, #000 25%, transparent 80%)`,
  corner: (at: string) => `radial-gradient(ellipse 70% 55% at ${at}, #000 0%, #000 30%, transparent 75%)`,
  fade_bottom: () => "linear-gradient(#000 60%, transparent)",
} as const satisfies Record<string, (at: string) => string | null>;

type PatternCss = { image: string; size?: string };

/** One tile or gradient per pattern; `c` is a validated hex colour, `at` a CSS position. */
const PATTERNS = {
  grid: (c) => ({
    image: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
    size: "30px 30px",
  }),
  dots: (c) => ({
    image: `radial-gradient(${c} 1px, transparent 1.5px)`,
    size: "18px 18px",
  }),
  halftone: (c) => ({
    image: `radial-gradient(circle, ${c} 1.6px, transparent 2.1px)`,
    size: "13px 13px",
  }),
  sunburst: (c, at) => ({
    image: `repeating-conic-gradient(from -90deg at ${at}, ${c} 0deg 0.9deg, transparent 0.9deg 4.5deg)`,
  }),
  pinstripe: (c) => ({
    image: `repeating-linear-gradient(90deg, ${c} 0 1px, transparent 1px 7px)`,
  }),
  gingham: (c) => {
    const half = `color-mix(in srgb, ${c} 50%, transparent)`;
    return {
      image: `repeating-linear-gradient(0deg, ${half} 0 16px, transparent 16px 32px), repeating-linear-gradient(90deg, ${half} 0 16px, transparent 16px 32px)`,
    };
  },
  stripes: (c) => ({
    image: `repeating-linear-gradient(45deg, ${c} 0 12px, transparent 12px 24px)`,
  }),
} as const satisfies Record<string, (c: string, at: string) => PatternCss>;

const FRAMES = {
  single_hairline: { double: false, corners: false, scallop: false },
  double_hairline: { double: true, corners: false, scallop: false },
  double_hairline_deco_corners: { double: true, corners: true, scallop: false },
  scallop: { double: false, corners: false, scallop: true },
} as const;

const BLOCK_EDGES = {
  straight: null,
  // Half-discs hanging from the block's bottom edge.
  scallop: {
    tile: "28px 14px",
    edge: 14,
    image: "radial-gradient(circle 14px at 50% 0, #000 98%, transparent 100%)",
  },
  // A sine-like swell; constant SVG, no interpolated values.
  wave: {
    tile: "80px 14px",
    edge: 14,
    image: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="14"><path d="M0 0H80V7C70 13 50 13 40 7C30 1 10 1 0 7Z"/></svg>')}")`,
  },
} as const;

/** `hex` at `opacity` (0-1) as a colour that can sit in a gradient or shadow. */
function withOpacity(hex: string, opacity: number): string {
  if (opacity >= 1) return hex;
  return `color-mix(in srgb, ${hex} ${Math.round(opacity * 1000) / 10}%, transparent)`;
}

function Paper({ layer }: { layer: Layer<"paper"> }) {
  const style: CSSProperties = {};
  const tone = safeHex(layer.tone);
  if (tone) style.backgroundColor = tone;
  const glow = safeHex(layer.glow);
  if (glow) {
    const c = withOpacity(glow, safeNumber(layer.glow_opacity, 0, 1, 1));
    style.backgroundImage = `radial-gradient(ellipse 80% 640px at 50% 0%, ${c}, transparent)`;
  }
  const vignette = safeHex(layer.vignette);
  if (vignette) {
    style.boxShadow = `inset 0 0 180px 24px ${withOpacity(vignette, safeNumber(layer.vignette_opacity, 0, 1, 1))}`;
  }
  return <div className="absolute inset-0" style={style} />;
}

function Pattern({ layer }: { layer: Layer<"pattern"> }) {
  const kind = ownKey(PATTERNS, layer.pattern);
  const color = safeHex(layer.color);
  if (!kind || !color) return null;
  const origin = ORIGINS[ownKey(ORIGINS, layer.origin) ?? "center"];
  const mask = MASKS[ownKey(MASKS, layer.mask) ?? "none"](origin.at);
  const css: PatternCss = PATTERNS[kind](color, origin.at);

  const style: CSSProperties = {
    backgroundImage: css.image,
    opacity: safeNumber(layer.opacity, 0.01, 0.35, 0.05),
  };
  if (css.size) style.backgroundSize = css.size;
  if (mask) {
    style.maskImage = mask;
    style.WebkitMaskImage = mask;
  }
  // A masked, edge-anchored pattern only needs the band the mask can show;
  // an unmasked one keeps covering the whole box.
  if (mask && origin.band) {
    style.left = 0;
    style.right = 0;
    style.height = "min(100%, 900px)";
    style[origin.band] = 0;
  } else {
    style.inset = 0;
  }
  return <div className="absolute" style={style} />;
}

function Texture({ layer, foil, blended }: { layer: Layer<"texture">; foil?: readonly string[]; blended: boolean }) {
  if (!isTextureKey(layer.texture)) return null;
  const url = textureUrl(layer.texture, layer.colors, foil);
  if (!url) return null;
  const blend = blended ? BLENDS[ownKey(BLENDS, layer.blend) ?? "normal"] : "normal";
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: url,
        backgroundSize: TEXTURE_SIZE[layer.texture],
        opacity: safeNumber(layer.opacity, 0.02, 0.4, 0.1),
        mixBlendMode: blend,
      }}
    />
  );
}

function ArtLayer({ layer, foil, region }: { layer: Layer<"art">; foil?: readonly string[]; region: Region }) {
  const Art = Object.hasOwn(ART, layer.art) ? ART[layer.art] : undefined;
  if (!Art) return null;
  const painted = layer.paint === "foil" && foilGradient(foil) !== null;
  return (
    <div className="absolute inset-0" style={{ opacity: safeNumber(layer.opacity, 0.1, 1, 1) }}>
      <Art
        placement={layer.placement}
        colors={painted ? [] : (safeHexList(layer.colors, 0, 8) ?? [])}
        paint={painted ? "foil" : undefined}
        density={layer.density}
        region={region}
      />
    </div>
  );
}

function Frame({ layer, foil }: { layer: Layer<"frame">; foil?: readonly string[] }) {
  const frame = ownKey(FRAMES, layer.frame);
  if (!frame) return null;
  const shape = FRAMES[frame];
  const inset = safeInt(layer.inset, 0, 32, 12);
  const gradient = layer.paint === "foil" ? foilGradient(foil) : null;
  const color = safeHex(layer.color);
  if (!gradient && !color) return null;

  // Foil is a gradient border-image (needs a transparent border); ink is a plain colour.
  const ink: CSSProperties = gradient
    ? { borderColor: "transparent", borderImage: `${gradient} 1` }
    : { borderColor: color ?? undefined };
  const line: CSSProperties = { borderStyle: "solid", borderWidth: 1, ...ink };

  if (shape.scallop) {
    const paint: CSSProperties = { background: gradient ?? color ?? undefined };
    const arcs = (image: string, size: string, repeat: string): CSSProperties => ({
      ...paint,
      maskImage: image,
      WebkitMaskImage: image,
      maskSize: size,
      WebkitMaskSize: size,
      maskRepeat: repeat,
      WebkitMaskRepeat: repeat,
    });
    // Filled half-discs along all four edges plus a dashed stitch line inside, as in the design preview.
    const arc = (at: string) => `radial-gradient(circle at ${at}, #000 7px, transparent 7.6px)`;
    const solid = color ?? safeHex(foil?.[Math.floor((foil.length - 1) / 2)]);
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-[9px]" style={arcs(arc("50% 0"), "18px 9px", "repeat-x")} />
        <div className="absolute inset-x-0 bottom-0 h-[9px]" style={arcs(arc("50% 100%"), "18px 9px", "repeat-x")} />
        <div className="absolute inset-y-0 left-0 w-[9px]" style={arcs(arc("0 50%"), "9px 18px", "repeat-y")} />
        <div className="absolute inset-y-0 right-0 w-[9px]" style={arcs(arc("100% 50%"), "9px 18px", "repeat-y")} />
        {solid && (
          <div
            className="absolute inset-[15px] rounded-md opacity-90"
            style={{ border: "1.5px dashed", borderColor: solid }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="absolute" style={{ inset, ...line }}>
      {shape.double && <div className="absolute inset-[3px] opacity-70" style={line} />}
      {shape.corners &&
        (
          [
            "-top-[5px] -left-[5px]",
            "-top-[5px] -right-[5px]",
            "-bottom-[5px] -left-[5px]",
            "-right-[5px] -bottom-[5px]",
          ] as const
        ).map((pos) => <div key={pos} className={`absolute size-[9px] rotate-45 bg-(--ev-bg) ${pos}`} style={line} />)}
    </div>
  );
}

function Block({ layer }: { layer: Layer<"block"> }) {
  const color = safeHex(layer.color);
  if (!color) return null;
  const edge = BLOCK_EDGES[ownKey(BLOCK_EDGES, layer.edge) ?? "straight"];
  const style: CSSProperties = { backgroundColor: color };
  if (edge) {
    const solid = "linear-gradient(#000, #000)";
    const image = `${solid}, ${edge.image}`;
    const size = `100% calc(100% - ${edge.edge}px), ${edge.tile}`;
    style.maskImage = image;
    style.WebkitMaskImage = image;
    style.maskSize = size;
    style.WebkitMaskSize = size;
    style.maskPosition = "0 0, 0 100%";
    style.WebkitMaskPosition = "0 0, 0 100%";
    style.maskRepeat = "no-repeat, repeat-x";
    style.WebkitMaskRepeat = "no-repeat, repeat-x";
  }
  return <div className="absolute inset-0" style={style} />;
}

function ImageLayer({ layer }: { layer: Layer<"image"> }) {
  const src = safeMediaSrc(layer.src);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="100vw"
      className="object-cover"
      style={{ opacity: safeNumber(layer.opacity, 0.05, 1, 1) }}
    />
  );
}

/**
 * Renders one region of a v2 theme's layer stack, bottom to top. The box is
 * decorative (`aria-hidden`, no pointer events) and clips its own overflow;
 * the parent must be `relative isolate` so `-z-10` stays inside it. Unknown
 * kinds, keys and values render nothing. Blend modes apply to textures only,
 * and only to the first three blended layers of the whole stack.
 */
export function LayerStack({
  layers,
  region,
  foil,
}: {
  layers: readonly ThemeLayer[] | undefined;
  region: Region;
  /** The theme's foil stops, for foil-painted frames, art and textures. */
  foil?: readonly string[];
}) {
  if (!layers?.length) return null;

  let blendedLeft = MAX_BLENDED;
  const items: ReactNode[] = [];
  layers.forEach((layer, i) => {
    const wantsBlend = layer.kind === "texture" && layer.blend !== undefined && layer.blend !== "normal";
    const blended = wantsBlend && blendedLeft > 0;
    if (wantsBlend) blendedLeft -= 1;
    // Art placed "in the hero" always belongs to the hero box, whatever region the manifest names.
    const heroArt = layer.kind === "art" && (layer.placement === "hero" || layer.placement === "hero_top");
    if ((heroArt ? "hero" : (layer.region ?? "page")) !== region) return;

    let node: ReactNode = null;
    switch (layer.kind) {
      case "paper":
        node = <Paper layer={layer} />;
        break;
      case "block":
        node = <Block layer={layer} />;
        break;
      case "pattern":
        node = <Pattern layer={layer} />;
        break;
      case "texture":
        node = <Texture layer={layer} foil={foil} blended={blended} />;
        break;
      case "art":
        node = <ArtLayer layer={layer} foil={foil} region={region} />;
        break;
      case "frame":
        node = <Frame layer={layer} foil={foil} />;
        break;
      case "image":
        node = <ImageLayer layer={layer} />;
        break;
      default:
        node = null;
    }
    if (node) items.push(<Fragment key={i}>{node}</Fragment>);
  });
  if (!items.length) return null;

  return (
    <div
      aria-hidden="true"
      data-ev-layers={region}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {items}
    </div>
  );
}
