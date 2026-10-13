import assert from "node:assert/strict";
import { test } from "node:test";

import type { Theme } from "../../../lib/api-types.ts";

import { heroDrawsBadge, heroDrawsPhoto } from "./hero-fields.ts";

// Only the fields the helpers read matter; the rest of a Theme is irrelevant here.
function theme(over: Record<string, unknown>): Theme {
  return { hero_style: "text_only", layout: "centered", ...over } as unknown as Theme;
}

test("heroDrawsPhoto: photo styles draw it, text_only does not", () => {
  for (const hero_style of ["full_bleed", "framed", "spotlight"]) {
    assert.equal(heroDrawsPhoto(theme({ hero_style })), true, hero_style);
  }
  assert.equal(heroDrawsPhoto(theme({ hero_style: "text_only" })), false);
});

test("heroDrawsPhoto: color_block needs a block layer", () => {
  assert.equal(heroDrawsPhoto(theme({ hero_style: "color_block" })), false);
  assert.equal(heroDrawsPhoto(theme({ hero_style: "color_block", layers: [{ kind: "paper" }] })), false);
  assert.equal(heroDrawsPhoto(theme({ hero_style: "color_block", layers: [{ kind: "block" }] })), true);
});

test("heroDrawsBadge: only v2 themes with a badge-carrying ornament", () => {
  assert.equal(heroDrawsBadge(theme({})), false);
  assert.equal(heroDrawsBadge(theme({ engine: 2, ornament: { hero: "none", badge: "none" } })), false);
  assert.equal(heroDrawsBadge(theme({ engine: 2, ornament: { hero: "wreath_monogram", badge: "none" } })), true);
  assert.equal(heroDrawsBadge(theme({ engine: 2, ornament: { hero: "foil_numeral", badge: "none" } })), true);
  assert.equal(heroDrawsBadge(theme({ engine: 2, ornament: { hero: "ring", badge: "none" } })), false);
  assert.equal(heroDrawsBadge(theme({ engine: 2, ornament: { hero: "none", badge: "wax_seal" } })), true);
  // A v1 theme never prints the badge, whatever an ornament says.
  assert.equal(heroDrawsBadge(theme({ ornament: { hero: "wreath_monogram", badge: "wax_seal" } })), false);
});
