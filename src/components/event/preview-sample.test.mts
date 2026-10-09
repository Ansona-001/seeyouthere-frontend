import assert from "node:assert/strict";
import { test } from "node:test";

import { previewSampleContent } from "./preview-sample.ts";

test("sample content has no media-dependent blocks and a badged, imageless hero", () => {
  const content = previewSampleContent();
  for (const type of ["gallery", "video", "guest_photos"]) {
    assert.equal(content.some((b) => b.type === type), false, type);
  }
  const hero = content.find((b) => b.type === "hero");
  assert.ok(hero && hero.type === "hero");
  assert.equal(hero.image, null);
  assert.equal(hero.badge, "A&T");
  assert.ok(content.length > 3);
});
