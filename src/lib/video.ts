// Video embed URL construction (build-out plan rich-blocks §6.4). Pure —
// only `import type` from api-types, so this loads under `node --test`
// without pulling in server/client React code.
//
// Security boundary: the backend (`internal/content/video.go`) is the source
// of truth for what counts as a valid `video_id`/`vimeo_hash` — see the
// regexes there. `isValidVideo` mirrors those regexes exactly as defence in
// depth; nothing here fetches a user-supplied URL or accepts a raw embed
// `src`. `videoEmbedUrl` only ever builds from two constant origins.

import type { VideoAspect, VideoProvider } from "./api-types";

export type ParsedVideo = { provider: VideoProvider; video_id: string; vimeo_hash: string };

// Mirrors internal/content/video.go: youtubeIDRe, vimeoIDRe, vimeoHashRe.
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID_RE = /^[1-9][0-9]{0,11}$/;
const VIMEO_HASH_RE = /^[0-9a-f]{8,16}$/;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);

/** Mirrors the Go validation. UX/defence-in-depth only — the API is the real boundary. */
export function isValidVideo(v: {
  provider: string;
  video_id: string;
  vimeo_hash: string;
}): v is ParsedVideo {
  if (v.provider === "youtube") {
    return YOUTUBE_ID_RE.test(v.video_id) && v.vimeo_hash === "";
  }
  if (v.provider === "vimeo") {
    if (!VIMEO_ID_RE.test(v.video_id)) return false;
    return v.vimeo_hash === "" || VIMEO_HASH_RE.test(v.vimeo_hash);
  }
  return false;
}

/**
 * Best-effort parse of a pasted YouTube/Vimeo URL into `{provider, video_id,
 * vimeo_hash}`, for the editor's "paste a link" UX only. `https:` only, no
 * userinfo, host must be exactly one of the allow-listed provider hosts. The
 * result always passes `isValidVideo`, or this returns null — the Go
 * regexes remain the actual security boundary.
 */
export function parseVideoUrl(input: string): ParsedVideo | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;

  const host = url.hostname.toLowerCase();
  const path = url.pathname;

  let parsed: ParsedVideo | null = null;

  if (YOUTUBE_HOSTS.has(host)) {
    if (host === "youtu.be") {
      const id = path.slice(1).split("/")[0];
      parsed = { provider: "youtube", video_id: id, vimeo_hash: "" };
    } else if (path === "/watch") {
      const id = url.searchParams.get("v");
      if (id) parsed = { provider: "youtube", video_id: id, vimeo_hash: "" };
    } else {
      const m = /^\/(shorts|live|embed)\/([^/]+)/.exec(path);
      if (m) parsed = { provider: "youtube", video_id: m[2], vimeo_hash: "" };
    }
  } else if (VIMEO_HOSTS.has(host)) {
    if (host === "player.vimeo.com") {
      const m = /^\/video\/([^/]+)/.exec(path);
      if (m) {
        const hash = url.searchParams.get("h") ?? "";
        parsed = { provider: "vimeo", video_id: m[1], vimeo_hash: hash };
      }
    } else {
      const m = /^\/(\d+)(?:\/([^/]+))?/.exec(path);
      if (m) parsed = { provider: "vimeo", video_id: m[1], vimeo_hash: m[2] ?? "" };
    }
  }

  if (!parsed) return null;
  return isValidVideo(parsed) ? parsed : null;
}

/**
 * The only place an iframe `src` is built (build-out plan rich-blocks §6.4,
 * §7 security table). `v` must already have passed `isValidVideo` — callers
 * (the video block, the editor preview) enforce this.
 */
export function videoEmbedUrl(v: ParsedVideo): string {
  if (v.provider === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.video_id)}?autoplay=1&rel=0&playsinline=1`;
  }
  const hash = v.vimeo_hash ? `&h=${encodeURIComponent(v.vimeo_hash)}` : "";
  return `https://player.vimeo.com/video/${encodeURIComponent(v.video_id)}?autoplay=1&dnt=1${hash}`;
}

/** Re-display in the editor for a re-opened block; not used for the embed itself. */
export function videoWatchUrl(v: ParsedVideo): string {
  if (v.provider === "youtube") {
    return `https://www.youtube.com/watch?v=${encodeURIComponent(v.video_id)}`;
  }
  return v.vimeo_hash
    ? `https://vimeo.com/${encodeURIComponent(v.video_id)}/${encodeURIComponent(v.vimeo_hash)}`
    : `https://vimeo.com/${encodeURIComponent(v.video_id)}`;
}

export const ASPECT_CLASS: Record<VideoAspect, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16] max-w-sm mx-auto",
};
