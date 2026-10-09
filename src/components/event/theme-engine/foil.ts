import { safeHexList } from "./safe.ts";

/**
 * The foil stops (3-5 validated hex colours) mirrored into a palindrome so a
 * gradient reads as a metallic sheen at any angle: `a b c d e d c b a`.
 * Returns `null` for anything that is not 3-5 valid hex colours.
 */
export function mirroredFoilStops(stops: unknown): { color: string; at: number }[] | null {
  const valid = safeHexList(stops, 3, 5);
  if (!valid) return null;
  const mirrored = [...valid, ...valid.slice(0, -1).reverse()];
  return mirrored.map((color, i) => ({
    color,
    at: Math.round((i / (mirrored.length - 1)) * 1000) / 10,
  }));
}

/** `linear-gradient(115deg, ...)` over the mirrored foil stops, or `null`. */
export function foilGradient(stops: unknown): string | null {
  const mirrored = mirroredFoilStops(stops);
  if (!mirrored) return null;
  return `linear-gradient(115deg, ${mirrored.map((s) => `${s.color} ${s.at}%`).join(", ")})`;
}
