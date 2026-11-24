import assert from "node:assert/strict";
import { test } from "node:test";

import { templatePreviewSrc } from "./template-preview.ts";

test("returns the base preview for a known slug", () => {
  assert.equal(templatePreviewSrc("classic"), "/templates/classic.webp");
  assert.equal(templatePreviewSrc("classic", null), "/templates/classic.webp");
});

test("uses the occasion variant when one ships", () => {
  assert.equal(templatePreviewSrc("classic", "wedding"), "/templates/classic--wedding.webp");
});

test("falls back to the base preview when the variant is not listed", () => {
  assert.equal(templatePreviewSrc("classic", "conference"), "/templates/classic.webp");
  assert.equal(templatePreviewSrc("wisteria", "wedding"), "/templates/wisteria.webp");
});

test("returns null for slugs without an image", () => {
  assert.equal(templatePreviewSrc("admin-made"), null);
  assert.equal(templatePreviewSrc("../etc/passwd"), null);
});

test("never interpolates an unlisted occasion into the URL", () => {
  assert.equal(templatePreviewSrc("classic", "../../x"), "/templates/classic.webp");
  assert.equal(templatePreviewSrc("classic", "wedding.webp?x="), "/templates/classic.webp");
});
