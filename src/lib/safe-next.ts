/**
 * Validates a `?next=` redirect target so login (and similar flows) only ever
 * send the browser somewhere on our own origin — see build-out plan §11.5 and
 * §12 ("Open redirect"). Returns the sanitised path (dropping anything that
 * isn't path/search/hash) or null if it isn't safe to use.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  // Must start with a single "/": reject protocol-relative ("//host/..") and
  // a leading slash-backslash, which some browsers normalise to "//" too.
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return null;
  }

  // Belt and braces: resolve against a fixed placeholder origin and confirm
  // the result didn't escape it. Backslashes elsewhere in the string, or
  // other WHATWG URL quirks, are treated as forward slashes for "special"
  // schemes like http(s), so origin equality is the reliable check.
  const base = "http://n.invalid";
  let resolved: URL;
  try {
    resolved = new URL(next, base);
  } catch {
    return null;
  }
  if (resolved.origin !== base) return null;

  // Resolving can collapse dot-segments (e.g. "/.//evil.com" -> "//evil.com"),
  // which would otherwise pass the origin check above but still be
  // protocol-relative once handed back to the caller. Validate the output too.
  const out = `${resolved.pathname}${resolved.search}${resolved.hash}`;
  if (out.startsWith("//") || out.startsWith("/\\")) return null;

  return out;
}
