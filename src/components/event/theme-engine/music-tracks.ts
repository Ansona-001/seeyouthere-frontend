/**
 * Allow-listed background tracks, keyed by the theme's `music` value: constant
 * same-origin files, never built from theme or user input. A plain module (not
 * the `"use client"` player) so server components can read it.
 */
export const MUSIC_TRACKS = { music_box: "/themes/music-box.mp3" } as const;
export type MusicTrack = keyof typeof MUSIC_TRACKS;

const CUSTOM_MUSIC = /^\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/audio\.mp3$/;

/** A host-uploaded track's same-origin path, or null for anything else (the value comes from the API). */
export function customMusicSrc(v: unknown): string | null {
  return typeof v === "string" && v.length <= 128 && CUSTOM_MUSIC.test(v) ? v : null;
}
