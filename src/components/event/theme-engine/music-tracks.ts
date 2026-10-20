/**
 * Allow-listed background tracks, keyed by the theme's `music` value: constant
 * same-origin files, never built from theme or user input. A plain module (not
 * the `"use client"` player) so server components can read it.
 */
export const MUSIC_TRACKS = { music_box: "/themes/music-box.mp3" } as const;
export type MusicTrack = keyof typeof MUSIC_TRACKS;
