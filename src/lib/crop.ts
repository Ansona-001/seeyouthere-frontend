// Pan-and-zoom crop maths for the photo cropper (src/components/image-cropper.tsx). Pure, so it is unit-tested.
//
// The picture is drawn at `coverScale * zoom` so it always covers the frame (zoom 1 = just covers). Its centre sits
// `offset` pixels away from the frame's centre. The crop is reported as fractions of the picture, so it stays right
// whatever size the browser decodes the picture at.

export type Size = { w: number; h: number };
export type Point = { x: number; y: number };
/** A crop as fractions (0-1) of the picture's width and height. */
export type CropRect = { x: number; y: number; w: number; h: number };

export const MAX_ZOOM = 4;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Scale at which the picture exactly covers the frame. */
export function coverScale(img: Size, frame: Size): number {
  return Math.max(frame.w / img.w, frame.h / img.h);
}

export function clampZoom(zoom: number): number {
  return Number.isFinite(zoom) ? clamp(zoom, 1, MAX_ZOOM) : 1;
}

/** Keeps the picture covering the frame: it can't be dragged far enough to show an empty edge. */
export function clampOffset(offset: Point, img: Size, frame: Size, zoom: number): Point {
  const scale = coverScale(img, frame) * zoom;
  const maxX = Math.max(0, (img.w * scale - frame.w) / 2);
  const maxY = Math.max(0, (img.h * scale - frame.h) / 2);
  // `+ 0` turns a clamped -0 into 0.
  return { x: clamp(offset.x, -maxX, maxX) + 0, y: clamp(offset.y, -maxY, maxY) + 0 };
}

/** The part of the picture inside the frame, as fractions of the picture. */
export function cropRect(img: Size, frame: Size, zoom: number, offset: Point): CropRect {
  const scale = coverScale(img, frame) * zoom;
  const w = Math.min(1, frame.w / scale / img.w);
  const h = Math.min(1, frame.h / scale / img.h);
  const cx = 0.5 - offset.x / scale / img.w;
  const cy = 0.5 - offset.y / scale / img.h;
  return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h };
}

/**
 * Zooms to `zoom` while keeping the picture point under `focal` (relative to the frame's centre) where it is, so a
 * pinch or a wheel turn zooms about the fingers or cursor instead of the middle. The offset is not clamped.
 */
export function zoomAbout(
  view: { zoom: number; offset: Point },
  zoom: number,
  focal: Point,
): { zoom: number; offset: Point } {
  const ratio = zoom / view.zoom;
  return {
    zoom,
    offset: { x: focal.x - (focal.x - view.offset.x) * ratio, y: focal.y - (focal.y - view.offset.y) * ratio },
  };
}

/** The largest frame of the given width / height ratio that fits inside a box. */
export function fitFrame(aspect: number, maxW: number, maxH: number): Size {
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  const w = Math.min(maxW, maxH * a);
  return { w: Math.round(w), h: Math.round(w / a) };
}
