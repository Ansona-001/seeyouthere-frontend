"use client";

import { useState } from "react";
import Image from "next/image";

import type { MediaRef, VideoProvider } from "@/lib/api-types";
import { isValidVideo, videoEmbedUrl } from "@/lib/video";
import { cn } from "@/lib/utils";

/**
 * Click-to-load facade for the video block (build-out plan rich-blocks
 * §6.4, §7 security table). Nothing is requested from YouTube/Vimeo until
 * the guest presses Play: the poster is our own media (or a themed
 * placeholder), never a hot-linked provider thumbnail.
 *
 * The iframe is only mounted client-side, after a click, with a sandbox
 * that omits top-navigation and forms, `referrerPolicy=strict-origin-when-
 * cross-origin` (required — YouTube's player errors without a Referer, and
 * this site sends `Referrer-Policy: same-origin`, so only the origin, never
 * the event slug/path, reaches the provider). `isValidVideo` is checked
 * again here (defence in depth) even though the caller already checked it:
 * if it somehow fails, nothing risky renders.
 */
export function VideoEmbed({
  provider,
  video_id,
  vimeo_hash,
  poster,
  posterAlt,
  title,
  interactive,
}: {
  provider: VideoProvider;
  video_id: string;
  vimeo_hash: string;
  poster: MediaRef | undefined;
  posterAlt: string;
  title: string;
  /** false in the editor preview: clicking never loads the provider iframe. */
  interactive: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const valid = isValidVideo({ provider, video_id, vimeo_hash });

  if (loaded && valid) {
    return (
      <iframe
        src={videoEmbedUrl({ provider, video_id, vimeo_hash })}
        title={title || "Video"}
        className="size-full"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />
    );
  }

  const providerLabel = provider === "youtube" ? "YouTube" : "Vimeo";

  return (
    <button
      type="button"
      disabled={!interactive || !valid}
      onClick={() => setLoaded(true)}
      aria-label={`Play video: ${title || "Video"}`}
      className={cn(
        "group relative size-full overflow-hidden bg-(--ev-surface)",
        interactive && valid ? "cursor-pointer" : "cursor-default",
      )}
    >
      {poster ? (
        <Image
          src={poster.src}
          alt=""
          fill
          sizes="(min-width: 768px) 42rem, 100vw"
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--ev-accent) 30%, transparent), color-mix(in srgb, var(--ev-accent) 8%, transparent))",
          }}
        />
      )}
      <span className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" aria-hidden="true" />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
        <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-(--ev-accent) shadow-lg transition-transform group-hover:scale-105">
          <svg viewBox="0 0 24 24" className="size-7 translate-x-px fill-current" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span className="text-xs tracking-wide text-white/90">
          {valid ? (interactive ? `Plays from ${providerLabel}` : "Plays on your live page") : "Video unavailable"}
        </span>
      </span>
      {posterAlt && <span className="sr-only">{posterAlt}</span>}
    </button>
  );
}
