import assert from "node:assert/strict";
import { test } from "node:test";

import { ogImageFor } from "./share-image.ts";

test("ogImageFor scales wide images down to 1080 wide", () => {
  assert.deepEqual(ogImageFor({ src: "/media/e/m", width: 2160, height: 1130 }), {
    url: "/media/e/m/1080.jpg",
    width: 1080,
    height: 565,
  });
});

test("ogImageFor keeps the size of images narrower than 1080", () => {
  assert.deepEqual(ogImageFor({ src: "/media/e/m", width: 800, height: 600 }), {
    url: "/media/e/m/1080.jpg",
    width: 800,
    height: 600,
  });
});
