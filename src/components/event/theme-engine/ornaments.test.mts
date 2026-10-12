import assert from "node:assert/strict";
import { test } from "node:test";

import {
  artClearance,
  badgeOrnamentKey,
  dividerOrnamentKey,
  heroOrnamentKey,
  sanitizeBadge,
  splitTitle,
} from "./ornament-keys.ts";

test("ornament keys map known values and reject everything else", () => {
  assert.equal(heroOrnamentKey("wreath_monogram"), "wreath_monogram");
  assert.equal(dividerOrnamentKey("wave"), "wave");
  assert.equal(dividerOrnamentKey("heart"), "heart");
  assert.equal(badgeOrnamentKey("wax_seal"), "wax_seal");
  for (const bad of ["none", "", "__proto__", "constructor", "toString", "Wave", "wave ", 1, null, undefined, {}]) {
    assert.equal(heroOrnamentKey(bad), null, String(bad));
    assert.equal(dividerOrnamentKey(bad), null, String(bad));
    assert.equal(badgeOrnamentKey(bad), null, String(bad));
  }
});

test("sanitizeBadge keeps letters, digits and & . + - only, at most four", () => {
  assert.equal(sanitizeBadge("A&T"), "A&T");
  assert.equal(sanitizeBadge("30"), "30");
  assert.equal(sanitizeBadge("A·B+"), "A·B+");
  assert.equal(sanitizeBadge("ÄÖ"), "ÄÖ");
  assert.equal(sanitizeBadge("ABCDEFG"), "ABCD");
  assert.equal(sanitizeBadge("<b>x"), "bx");
  assert.equal(sanitizeBadge("a b\n‮\u0000😀"), "ab");
  assert.equal(sanitizeBadge("٣٤"), "٣٤"); // Nd digits are allowed, as in the backend
  assert.equal(sanitizeBadge("²½"), ""); // No digits are not
  for (const bad of [null, undefined, 5, {}, []]) assert.equal(sanitizeBadge(bad), "");
});

test("splitTitle separates ampersands without interpreting markup", () => {
  assert.deepEqual(splitTitle("Amelia & Theo"), [
    { text: "Amelia", amp: false },
    { text: "&", amp: true },
    { text: "Theo", amp: false },
  ]);
  assert.deepEqual(splitTitle("Party"), [{ text: "Party", amp: false }]);
  assert.deepEqual(splitTitle("&"), [{ text: "&", amp: true }]);
  assert.deepEqual(splitTitle("<img src=x>"), [{ text: "<img src=x>", amp: false }]);
  assert.deepEqual(splitTitle(""), []);
});

test("artClearance reserves space only for drawn art", () => {
  const layers = [
    { kind: "art", art: "olive_branches", placement: "corners", colors: [], opacity: 1 },
    { kind: "art", art: "mirror_ball", placement: "hero_top", colors: [], opacity: 1 },
    { kind: "art", art: "__proto__", placement: "corners", colors: [], opacity: 1 },
    { kind: "paper", tone: "#FFFFFF" },
  ] as never;
  assert.deepEqual(artClearance(layers, () => false), { top: 0, bottom: 0, reserve: 0 });
  assert.deepEqual(artClearance(layers, () => true), { top: 118, bottom: 70, reserve: 236 });
  assert.deepEqual(artClearance(undefined, () => true), { top: 0, bottom: 0, reserve: 0 });
});
