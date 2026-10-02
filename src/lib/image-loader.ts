import type { ImageLoader } from "next/image";

const WIDTHS = [480, 1080, 1920] as const;

/**
 * Custom `next/image` loader for event and template media. Renditions are
 * pre-generated in Go at upload time as three fixed JPEG widths (480/1080/1920)
 * and served as immutable static files by Caddy (build-out plan §6.2) — Next's
 * built-in (sharp) optimizer is never used, since re-encoding on every request
 * would cost CPU/RAM we don't have on a 1 vCPU box.
 *
 * `src` is the API's `media.src` value, e.g. `/media/<event_id>/<media_id>`
 * or `/media/templates/<template_id>/<version>/background`; the smallest
 * available width that is still >= the requested width is appended.
 */
const eventImageLoader: ImageLoader = ({ src, width }) => {
  const target = WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1];
  return `${src}/${target}.jpg`;
};

export default eventImageLoader;
