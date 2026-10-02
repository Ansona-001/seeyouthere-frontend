import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Next.js 16 renamed Middleware to Proxy (functionality unchanged); pattern
// adapted from node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md
// and the build-out plan §11.5.

function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").origin;
  } catch {
    return "http://localhost:8080";
  }
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Turbopack's dev-mode HMR injects its own unnonced <style> elements for
    // CSS chunks (Next.js 16.3.6 known limitation — verified absent from a
    // production build, only ever observed via `next dev`). A nonce and
    // 'unsafe-inline' together are not additive per the CSP spec: once a
    // nonce-source is present, browsers ignore 'unsafe-inline' entirely, so
    // this must be a dev-only branch rather than appending 'unsafe-inline'
    // unconditionally.
    isDev ? "style-src 'self' 'unsafe-inline'" : `style-src 'self' 'nonce-${nonce}'`,
    // Event themes set CSS custom properties (--ev-bg, --ev-accent, …) via a
    // `style` attribute; the values are hex colours validated server-side
    // (never raw user HTML), so this is safe to allow — build-out plan §11.3.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin()}`,
    // Rich-blocks video embeds (click-to-load facade, `src/lib/video.ts`)
    // only ever point at one of these two constant origins — never a raw
    // user-supplied URL. Needs security review alongside the video facade.
    // The location block's map embed (`src/lib/urls.ts` googleMapsEmbedUrl)
    // only ever points at www.google.com, built from our own address text,
    // never from the accepted-but-unvalidated-for-framing `map_url`.
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://www.google.com",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  // Pages are dynamic anyway (cookie-gated), so a per-request nonce costs nothing extra.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "same-origin");
  response.headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|media/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
