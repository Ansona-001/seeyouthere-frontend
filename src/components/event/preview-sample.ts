import type { Block, MediaMap } from "@/lib/api-types";

import { fixtureContent, fixtureStartsAt } from "./fixtures.ts";

// Sample event for the admin template preview. Blocks that need uploaded
// media (images, video, guest photos) are dropped so the preview never shows
// broken images; the hero gets a badge so v2 badge ornaments render.

const MEDIA_BLOCKS = new Set<Block["type"]>(["gallery", "video", "guest_photos"]);

export const previewSampleMedia: MediaMap = {};
export const previewSampleStartsAt = fixtureStartsAt;

export function previewSampleContent(): Block[] {
  return fixtureContent
    .filter((block) => !MEDIA_BLOCKS.has(block.type))
    .map((block) => (block.type === "hero" ? { ...block, image: null, badge: "A&T" } : block));
}
