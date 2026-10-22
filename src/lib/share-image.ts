import type { MediaRef } from "./api-types.ts";

/**
 * The link-preview image the API serves (`og.jpg`): the picture in its own aspect ratio, built from the 1080 px
 * rendition and shrunk, never enlarged, to fit inside 1200x630. Nothing is cropped, padded or stretched.
 */
const OG_MAX_WIDTH = 1200;
const OG_MAX_HEIGHT = 630;
const OG_SOURCE_WIDTH = 1080;

/** Open Graph image descriptor for a media ref, with the size the API will actually serve. */
export function ogImageFor(ref: MediaRef): { url: string; width: number; height: number } {
  const srcW = Math.min(ref.width, OG_SOURCE_WIDTH);
  const srcH = Math.max(1, Math.round((ref.height * srcW) / ref.width));
  const scale = Math.min(1, OG_MAX_WIDTH / srcW, OG_MAX_HEIGHT / srcH);
  return {
    url: `${ref.src}/og.jpg`,
    width: Math.max(1, Math.round(srcW * scale)),
    height: Math.max(1, Math.round(srcH * scale)),
  };
}
