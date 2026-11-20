import { siteUrl } from "./site.ts";

const TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** The URL an entry pass's QR code encodes. The token rides in the fragment so it never reaches a server log. */
export function passUrl(token: string): string {
  return `${siteUrl().origin}/checkin#${token}`;
}

/**
 * Extracts the pass token from scanned text, or null. Accepts only exactly
 * `${SITE_URL}/checkin#<43 base64url chars>`: anything else (other origins, extra
 * path/query, odd tokens) is ignored. The result is a token to POST — scanned text
 * must never be navigated to or rendered as a link.
 */
export function parsePassUrl(text: string): string | null {
  const prefix = `${siteUrl().origin}/checkin#`;
  if (!text.startsWith(prefix)) return null;
  const token = text.slice(prefix.length);
  return TOKEN.test(token) ? token : null;
}
