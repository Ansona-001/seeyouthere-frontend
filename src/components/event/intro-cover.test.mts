import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { INTROS } from "./theme-engine/intros.ts";
import { ownKey } from "./theme-engine/safe.ts";

// Node's type stripping cannot load .tsx, so the component's markup is checked from its source text.
const src = readFileSync(new URL("./intro-cover.tsx", import.meta.url), "utf8");

test("intro cover markup is accessible and safe", () => {
  assert.equal(src.match(/<button[^>]*type="button"/g)?.length, 1);
  assert.equal(src.match(/<button/g)?.length, 1);
  assert.match(src, /Tap to open/);
  assert.ok(src.includes(".ev-intro{display:none!important}"));
  assert.match(src, /role="dialog"/);
  // Modal on the live page; the editor preview sits inside the editor, so it is not.
  assert.match(src, /aria-modal=\{preview \? undefined : "true"\}/);
  const imgs = src.match(/<img[^>]*\/>/g) ?? [];
  assert.equal(imgs.length, 3);
  for (const img of imgs) {
    assert.match(img, /alt=""/);
    assert.match(img, /src=\{art\.(strand|bow)\.src\}/);
  }
  assert.doesNotMatch(src, /dangerouslySetInnerHTML|<script|\son(?!Click)[A-Z][a-zA-Z]*=/);
  for (const art of Object.values(INTROS)) {
    for (const part of Object.values(art)) assert.match(part.src, /^\/themes\/wisteria-[a-z]+\.webp$/);
  }
});

test("INTROS lookups reject non-keys", () => {
  assert.equal(ownKey(INTROS, "none"), null);
  assert.equal(ownKey(INTROS, "constructor"), null);
  assert.equal(ownKey(INTROS, "wisteria"), "wisteria");
});
