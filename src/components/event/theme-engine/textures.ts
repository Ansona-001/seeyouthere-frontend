import { safeHexList } from "./safe.ts";

export type TextureKey = "grain" | "fibers" | "linen" | "wood" | "watercolour" | "foil" | "marble" | "velvet";

/**
 * Material textures as SVG `feTurbulence` tiles, ported from the design
 * generator (design/src/art.mjs). They are only ever used as a CSS
 * `background-image` data URL: the browser rasterises the filter once per
 * tile and caches the bitmap, so no SVG filter runs on a live element.
 * The strings are constants; the only interpolated values are `#RRGGBB`
 * colours that passed `safeHexList`.
 */
const NS = 'xmlns="http://www.w3.org/2000/svg"';

const GRAIN = `<svg ${NS} width="220" height="220"><filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity=".55"/></svg>`;

const FIBERS = `<svg ${NS} width="300" height="300"><filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .22" numOctaves="2" seed="4" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .36  0 0 0 0 .27  0 0 0 0 .16  0 0 0 1.6 -.75"/></filter><rect width="100%" height="100%" filter="url(#f)"/></svg>`;

// Warp and weft noise multiplied into a woven cross-hatch.
const LINEN = `<svg ${NS} width="240" height="240"><filter id="l" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .015" numOctaves="2" seed="2" stitchTiles="stitch" result="a"/><feTurbulence type="fractalNoise" baseFrequency=".015 .9" numOctaves="2" seed="5" stitchTiles="stitch" result="b"/><feBlend in="a" in2="b" mode="multiply"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".55"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#l)"/></svg>`;

const WOOD = `<svg ${NS} width="600" height="600"><filter id="w" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".0035 .045" numOctaves="4" seed="9" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#w)"/></svg>`;

const MARBLE = `<svg ${NS} width="420" height="420"><filter id="m" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency=".008 .016" numOctaves="5" seed="11" stitchTiles="stitch"/><feColorMatrix values="0 0 0 -1.4 1.05  0 0 0 -1.4 1.0  0 0 0 -1.4 .92  0 0 0 0 1"/><feComponentTransfer><feFuncR type="gamma" exponent="7"/><feFuncG type="gamma" exponent="7"/><feFuncB type="gamma" exponent="7"/></feComponentTransfer></filter><rect width="100%" height="100%" fill="#777"/><rect width="100%" height="100%" filter="url(#m)"/></svg>`;

// Soft low-frequency sheen (no lighting kernel, so the tile stitches cleanly), tinted by the blend mode.
const VELVET = `<svg ${NS} width="480" height="480"><filter id="v" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".006 .012" numOctaves="3" seed="5" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="gamma" exponent="1.6"/><feFuncG type="gamma" exponent="1.6"/><feFuncB type="gamma" exponent="1.6"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#v)"/></svg>`;

function watercolour([a, b, c]: string[]): string {
  return `<svg ${NS} width="400" height="500" viewBox="0 0 400 500"><filter id="bleed" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="3"/><feDisplacementMap in="SourceGraphic" scale="70"/><feGaussianBlur stdDeviation="14"/></filter><filter id="rim" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="4" seed="8"/><feDisplacementMap in="SourceGraphic" scale="46"/><feGaussianBlur stdDeviation="1.4"/></filter><filter id="pp"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".22"/></feComponentTransfer></filter><g filter="url(#bleed)" opacity=".8"><circle cx="80" cy="100" r="125" fill="${a}"/><circle cx="330" cy="150" r="115" fill="${b}"/><circle cx="250" cy="420" r="145" fill="${c}"/><circle cx="50" cy="430" r="95" fill="${b}"/></g><g filter="url(#rim)" fill="none" stroke-width="5" opacity=".35"><circle cx="80" cy="100" r="112" stroke="${a}"/><circle cx="330" cy="150" r="102" stroke="${b}"/><circle cx="250" cy="420" r="130" stroke="${c}"/></g><rect width="400" height="500" filter="url(#pp)" style="mix-blend-mode:multiply"/></svg>`;
}

function foil(stops: string[]): string {
  // 3-5 stops spread over the five slots of the lit gradient.
  const at = (i: number) => stops[Math.round((i * (stops.length - 1)) / 4)];
  return `<svg ${NS} width="400" height="400"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${at(0)}"/><stop offset=".3" stop-color="${at(1)}"/><stop offset=".5" stop-color="${at(2)}"/><stop offset=".72" stop-color="${at(3)}"/><stop offset="1" stop-color="${at(4)}"/></linearGradient><filter id="c" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="3" seed="2"/><feDiffuseLighting surfaceScale="2.4" lighting-color="#fff" diffuseConstant="1.05"><feDistantLight azimuth="225" elevation="48"/></feDiffuseLighting></filter></defs><rect width="400" height="400" fill="url(#g)"/><rect width="400" height="400" filter="url(#c)" style="mix-blend-mode:soft-light" opacity=".9"/></svg>`;
}

/** `background-size` for each texture: seamless tiles repeat at their natural size, one-offs cover. */
export const TEXTURE_SIZE: Record<TextureKey, string> = {
  grain: "220px",
  fibers: "300px",
  linen: "240px",
  wood: "600px",
  watercolour: "cover",
  foil: "cover",
  marble: "420px",
  velvet: "480px",
};

const STATIC: Partial<Record<TextureKey, string>> = {
  grain: GRAIN,
  fibers: FIBERS,
  linen: LINEN,
  wood: WOOD,
  marble: MARBLE,
  velvet: VELVET,
};

function toUrl(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function isTextureKey(value: unknown): value is TextureKey {
  return typeof value === "string" && Object.hasOwn(TEXTURE_SIZE, value);
}

/**
 * CSS `url("data:image/svg+xml,...")` for a texture, or `null` for an unknown
 * key or unusable colours. `colors` is only read by `watercolour` (exactly
 * three hex colours); `foilStops` only by `foil` (3-5 hex colours).
 */
export function textureUrl(key: unknown, colors?: unknown, foilStops?: unknown): string | null {
  if (!isTextureKey(key)) return null;
  switch (key) {
    case "watercolour": {
      const trio = safeHexList(colors, 3, 3);
      return trio ? toUrl(watercolour(trio)) : null;
    }
    case "foil": {
      const stops = safeHexList(foilStops, 3, 5);
      return stops ? toUrl(foil(stops)) : null;
    }
    default: {
      const svg = STATIC[key];
      return svg ? toUrl(svg) : null;
    }
  }
}
