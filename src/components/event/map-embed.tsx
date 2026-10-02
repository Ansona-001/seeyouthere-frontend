"use client";

import { useState } from "react";

/**
 * Click-to-load facade for the location block's map (mirrors
 * `video-embed.tsx`'s pattern). Nothing is requested from Google until the
 * guest presses "Show map": the placeholder is purely local markup, so no
 * IP/address/referrer reaches Google just from scrolling the block into
 * view.
 *
 * The iframe is only mounted client-side, after a click, with a sandbox that
 * omits top-navigation and forms, and `referrerPolicy=strict-origin-when-
 * cross-origin` so only this site's origin — never the event slug/path —
 * reaches Google.
 */
export function MapEmbed({
  src,
  title,
  label,
  interactive,
}: {
  /** Null when the address couldn't be encoded into an embed URL. */
  src: string | null;
  title: string;
  /** Address text shown on the placeholder, if present. */
  label?: string;
  /** false in the editor preview: clicking never loads the Google iframe. */
  interactive: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded && src) {
    return (
      <iframe
        src={src}
        title={title}
        className="size-full border-0"
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin"
      />
    );
  }

  return (
    <button
      type="button"
      disabled={!interactive || !src}
      onClick={() => setLoaded(true)}
      aria-label={`Show map${label ? `: ${label}` : ""}`}
      className="group flex size-full flex-col items-center justify-center gap-2 bg-(--ev-surface) text-(--ev-muted) disabled:cursor-default enabled:cursor-pointer"
    >
      <svg viewBox="0 0 24 24" className="size-8 fill-current" aria-hidden="true">
        <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
      </svg>
      <span className="text-sm font-medium text-(--ev-text)">
        {src ? (interactive ? "Show map" : "Map shown on your live page") : "Map unavailable"}
      </span>
      {label && <span className="max-w-[80%] truncate text-xs">{label}</span>}
    </button>
  );
}
