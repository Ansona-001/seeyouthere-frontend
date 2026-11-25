import assert from "node:assert/strict";
import { test } from "node:test";

import { clampOffset, clampZoom, coverScale, cropRect, fitFrame, MAX_ZOOM, zoomAbout } from "./crop.ts";

const approx = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !~ ${b}`);

test("cover scale fills the frame on both axes", () => {
  approx(coverScale({ w: 2000, h: 1000 }, { w: 100, h: 100 }), 0.1);
  approx(coverScale({ w: 1000, h: 2000 }, { w: 100, h: 100 }), 0.1);
});

test("an untouched crop of a wide picture into a square keeps the centre", () => {
  const r = cropRect({ w: 2000, h: 1000 }, { w: 100, h: 100 }, 1, { x: 0, y: 0 });
  approx(r.x, 0.25);
  approx(r.y, 0);
  approx(r.w, 0.5);
  approx(r.h, 1);
});

test("zooming in halves the cropped area", () => {
  const r = cropRect({ w: 1000, h: 1000 }, { w: 100, h: 100 }, 2, { x: 0, y: 0 });
  approx(r.w, 0.5);
  approx(r.h, 0.5);
  approx(r.x, 0.25);
});

test("dragging the picture right shows more of its left side", () => {
  const r = cropRect({ w: 1000, h: 1000 }, { w: 100, h: 100 }, 2, { x: 50, y: 0 });
  assert.ok(r.x < 0.25);
  approx(r.x, 0);
});

test("offset is clamped so no empty edge shows", () => {
  const img = { w: 1000, h: 1000 };
  const frame = { w: 100, h: 100 };
  assert.deepEqual(clampOffset({ x: 999, y: -999 }, img, frame, 1), { x: 0, y: 0 });
  assert.deepEqual(clampOffset({ x: 999, y: -999 }, img, frame, 2), { x: 50, y: -50 });
});

test("the crop always stays inside the picture", () => {
  for (const zoom of [1, 1.5, 4]) {
    for (const x of [-500, 0, 500]) {
      const frame = { w: 90, h: 120 };
      const img = { w: 3000, h: 1200 };
      const r = cropRect(img, frame, zoom, clampOffset({ x, y: x }, img, frame, zoom));
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= 1 + 1e-9 && r.y + r.h <= 1 + 1e-9);
    }
  }
});

test("zoom is bounded and rejects junk", () => {
  assert.equal(clampZoom(0.2), 1);
  assert.equal(clampZoom(99), MAX_ZOOM);
  assert.equal(clampZoom(Number.NaN), 1);
});

test("frames fit their box and keep the ratio", () => {
  assert.deepEqual(fitFrame(1, 300, 400), { w: 300, h: 300 });
  assert.deepEqual(fitFrame(4 / 5, 300, 300), { w: 240, h: 300 });
  assert.deepEqual(fitFrame(16 / 9, 320, 400), { w: 320, h: 180 });
  assert.deepEqual(fitFrame(0, 100, 100), { w: 100, h: 100 });
});

test("zooming about a point keeps the picture under it still", () => {
  const start = { zoom: 1, offset: { x: 0, y: 0 } };
  // A point 40px right of centre stays 40px right of centre: the picture slides left as it grows.
  const next = zoomAbout(start, 2, { x: 40, y: 0 });
  assert.deepEqual(next, { zoom: 2, offset: { x: -40, y: 0 } });
  // About the centre nothing slides.
  assert.deepEqual(zoomAbout(start, 3, { x: 0, y: 0 }).offset, { x: 0, y: 0 });
  // Zooming back out about the same point returns to the start.
  assert.deepEqual(zoomAbout(next, 1, { x: 40, y: 0 }), { zoom: 1, offset: { x: 0, y: 0 } });
});
