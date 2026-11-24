// Static preview images for template cards, shared by the editor's design panel and the public gallery.

/** Slugs that ship a preview at public/templates/<slug>.webp; anything else (e.g. admin-created) gets a swatch. */
const PREVIEW_SLUGS: ReadonlySet<string> = new Set([
  "olive-grove", "letterpress", "velvet-foil", "sunlit", "sprinkles", "risograph",
  "cloud-nine", "gingham", "open-door", "terrazzo", "gilt-noir", "mirror-ball",
  "heirloom", "confetti", "classic", "garden", "modern", "minimal", "mimosa", "harvest", "marigold", "wildflower",
  "clothesline", "welcome-home", "lovebirds", "fizz", "glitterball",
  "nocturne", "silk-knot", "candlelight", "lullaby", "lit-window", "afterglow", "wisteria", "temple-pond", "lotus-velvet", "ganesha-mandapam",
]);

/**
 * Occasion-specific previews at public/templates/<slug>--<occasion>.webp for the
 * v1 templates. Keys are a static allowlist: the occasion comes from
 * the event, so it is never interpolated into a URL unless it is listed here.
 */
const OCCASION_PREVIEWS: ReadonlySet<string> = new Set([
  ...["wedding", "engagement", "birthday", "baby-shower", "housewarming", "party"].flatMap((o) => [
    `classic--${o}`,
    `modern--${o}`,
    `minimal--${o}`,
  ]),
  ...["birthday", "party", "baby-shower", "housewarming"].map((o) => `confetti--${o}`),
  ...["wedding", "engagement", "baby-shower"].map((o) => `garden--${o}`),
  ...["wedding", "engagement"].map((o) => `heirloom--${o}`),
]);

/** Preview image path for a template (occasion variant when one ships), or null when there is no image. */
export function templatePreviewSrc(slug: string, occasionSlug?: string | null): string | null {
  if (!PREVIEW_SLUGS.has(slug)) return null;
  if (occasionSlug) {
    const variant = `${slug}--${occasionSlug}`;
    if (OCCASION_PREVIEWS.has(variant)) return `/templates/${variant}.webp`;
  }
  return `/templates/${slug}.webp`;
}
