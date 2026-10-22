import assert from "node:assert/strict";
import { test } from "node:test";

import { ogImageFor } from "./share-image.ts";

test("ogImageFor keeps a wide picture's own ratio, shrunk to the 1080 rendition", () => {
  assert.deepEqual(ogImageFor({ src: "/media/e/m", width: 2160, height: 1130 }), {
    url: "/media/e/m/og.jpg",
    width: 1080,
    height: 565,
  });
});

test("ogImageFor shrinks a portrait invitation to the card height without cropping", () => {
  assert.deepEqual(ogImageFor({ src: "/media/e/m", width: 800, height: 1200 }), {
    url: "/media/e/m/og.jpg",
    width: 420,
    height: 630,
  });
});

test("ogImageFor never enlarges a small picture", () => {
  assert.deepEqual(ogImageFor({ src: "/media/e/m", width: 400, height: 300 }), {
    url: "/media/e/m/og.jpg",
    width: 400,
    height: 300,
  });
});
