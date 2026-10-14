import assert from "node:assert/strict";
import { test } from "node:test";

import { suggestSlug } from "./slug.ts";

test("turns names into a hyphenated slug", () => {
  assert.equal(suggestSlug("Alex & Sam"), "alex-and-sam");
  assert.equal(suggestSlug("Priya's Baby Shower"), "priya-s-baby-shower");
  assert.equal(suggestSlug("  Sam's 30th!  "), "sam-s-30th");
});

test("strips accents and collapses separators", () => {
  assert.equal(suggestSlug("José  &  Zoë"), "jose-and-zoe");
  assert.equal(suggestSlug("a---b___c"), "a-b-c");
});

test("returns empty when nothing usable remains", () => {
  assert.equal(suggestSlug(""), "");
  assert.equal(suggestSlug("Untitled event"), "");
  assert.equal(suggestSlug("!!"), "");
  assert.equal(suggestSlug("日本語"), "");
});

test("caps at 50 characters without a trailing hyphen", () => {
  const slug = suggestSlug("a".repeat(49) + " b cde");
  assert.ok(slug.length <= 50);
  assert.ok(!slug.endsWith("-"));
  assert.match(slug, /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/);
});
