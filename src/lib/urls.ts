/**
 * Defence-in-depth URL checks for the event renderer. The API already
 * validates `links.url` and `location.map_url` before storing them (build-out
 * plan §3.1 "URL rule"), but per AGENTS.md we never trust a scheme just
 * because it came from "our" data — every href is re-checked here before use.
 */
export function isSafeHttpsUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}

/** Fallback map link when a location block has no (or an invalid) `map_url`. */
export function googleMapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Embeddable static-map iframe `src`, built from our own validated
 * `block.address` text only — never from a pasted/accepted `map_url` (those
 * are share links, not designed for framing, and Google/Apple block framing
 * most of them via X-Frame-Options/CSP). `output=embed` is a long-standing,
 * widely used, keyless Google Maps embed form; it's unofficial/undocumented
 * but stable in practice. Caller must still gate on `address` being
 * non-empty.
 *
 * `encodeURIComponent` throws on a lone UTF-16 surrogate (e.g. from a paste
 * mid-edit in the block editor); callers — including the live-build-up
 * editor preview, which recomputes this on every keystroke — must treat a
 * malformed address as "no embed available" rather than crashing, so this
 * returns `null` instead of throwing.
 */
export function googleMapsEmbedUrl(address: string): string | null {
  try {
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
  } catch {
    return null;
  }
}
