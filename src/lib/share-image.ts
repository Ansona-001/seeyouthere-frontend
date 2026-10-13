import type { MediaRef } from "./api-types.ts";

const OG_MAX_WIDTH = 1080;

/** Open Graph image descriptor for a media ref, using the 1080 px JPEG rendition (never upscaled). */
export function ogImageFor(ref: MediaRef): { url: string; width: number; height: number } {
  const width = Math.min(ref.width, OG_MAX_WIDTH);
  return { url: `${ref.src}/1080.jpg`, width, height: Math.round((ref.height * width) / ref.width) };
}
