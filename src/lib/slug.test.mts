import assert from "node:assert/strict";
import { test } from "node:test";

import { suggestSlug } from "./slug.ts";

test("turns names into a hyphenated slug", () => {
  assert.equal(suggestSlug("Alex & Sam"), "alex-and-sam");
  assert.equal(suggestSlug("Priya's Baby Shower"), "priyas-baby-shower");
  assert.equal(suggestSlug("  Sam's 30th!  "), "sams-30th");
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

test("caps at 40 characters without a trailing hyphen", () => {
  const slug = suggestSlug("a".repeat(49) + " b cde");
  assert.ok(slug.length <= 40);
  assert.ok(!slug.endsWith("-"));
  assert.match(slug, /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/);
});

test("adds the occasion word so the link says what the event is", () => {
  assert.equal(suggestSlug("Alex & Sam", "wedding"), "alex-and-sam-wedding");
  assert.equal(suggestSlug("Alex & Sam", "engagement"), "alex-and-sam-engagement");
  assert.equal(suggestSlug("Sam", "baby-shower"), "sam-baby-shower");
  assert.equal(suggestSlug("Sam's birthday", "birthday"), "sams-birthday");
  assert.equal(suggestSlug("Alex & Sam's Wedding", "wedding"), "alex-and-sams-wedding");
});

test("leaves the title alone for occasions without a suffix", () => {
  assert.equal(suggestSlug("Summer party", "party"), "summer-party");
  assert.equal(suggestSlug("Summer party", "unknown"), "summer-party");
});

test("keeps the occasion word when the names are long", () => {
  const slug = suggestSlug("Alexandria Montgomery & Bartholomew Fitzgerald", "wedding");
  assert.ok(slug.length <= 40);
  assert.ok(slug.endsWith("-wedding"));
  assert.ok(!slug.includes("--"));
});

test("returns empty for an unusable title even with an occasion", () => {
  assert.equal(suggestSlug("", "wedding"), "");
  assert.equal(suggestSlug("日本語", "wedding"), "");
});
