/**
 * Validators for every value a v2 theme puts into CSS or SVG. The API
 * already validates the manifest, but the renderer treats the resolved theme
 * as untrusted anyway: a value is used only if it is a strict `#RRGGBB`, a
 * finite clamped number, a `/media/...` path or a member of an allowlist.
 * Nothing else is ever concatenated into CSS text, `url()` or SVG markup.
 */

const HEX = /^#[0-9A-F]{6}$/i;
const MEDIA_SRC = /^\/media\/[A-Za-z0-9/_-]+$/;

/** The colour as given if it is exactly `#RRGGBB`, else `null`. */
export function safeHex(value: unknown): string | null {
  return typeof value === "string" && HEX.test(value) ? value : null;
}

/** Every entry must be a valid hex colour; a single bad entry rejects the list. */
export function safeHexList(value: unknown, min: number, max: number): string[] | null {
  if (!Array.isArray(value) || value.length < min || value.length > max) return null;
  const out: string[] = [];
  for (const item of value) {
    const hex = safeHex(item);
    if (!hex) return null;
    out.push(hex);
  }
  return out;
}

/** A finite number clamped to `[min, max]`, else `fallback` (non-numbers, NaN, ±Infinity). */
export function safeNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/** An integer version of `safeNumber`. */
export function safeInt(value: unknown, min: number, max: number, fallback: number): number {
  return Math.round(safeNumber(value, min, max, fallback));
}

/** A same-origin media path (`/media/<id>/...`), else `null`. No dots, so no `..`; no `//`. */
export function safeMediaSrc(value: unknown): string | null {
  return typeof value === "string" && value.length <= 256 && MEDIA_SRC.test(value) && !value.includes("//")
    ? value
    : null;
}

/** `value` if it is an own key of `table` (never an inherited one such as `constructor`), else `null`. */
export function ownKey<T extends object>(table: T, value: unknown): (keyof T & string) | null {
  return typeof value === "string" && Object.hasOwn(table, value) ? (value as keyof T & string) : null;
}
