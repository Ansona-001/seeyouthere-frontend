import assert from "node:assert/strict";
import { test } from "node:test";

import { googleMapsEmbedUrl, googleMapsSearchUrl, isSafeHttpsUrl } from "./urls.ts";

test("isSafeHttpsUrl accepts plain https URLs and rejects everything else", () => {
  assert.equal(isSafeHttpsUrl("https://example.com/maps"), true);
  assert.equal(isSafeHttpsUrl(null), false);
  assert.equal(isSafeHttpsUrl(undefined), false);
  assert.equal(isSafeHttpsUrl(""), false);
  assert.equal(isSafeHttpsUrl("http://example.com"), false);
  assert.equal(isSafeHttpsUrl("javascript:alert(1)"), false);
  assert.equal(isSafeHttpsUrl("https://user:pass@example.com"), false);
  assert.equal(isSafeHttpsUrl("not a url"), false);
});

test("googleMapsSearchUrl encodes the address into a search link", () => {
  assert.equal(
    googleMapsSearchUrl("123 Main St, Springfield"),
    "https://www.google.com/maps/search/?api=1&query=123%20Main%20St%2C%20Springfield",
  );
});

test("googleMapsEmbedUrl builds an embed link for a normal address", () => {
  assert.equal(
    googleMapsEmbedUrl("123 Main St, Springfield"),
    "https://www.google.com/maps?q=123%20Main%20St%2C%20Springfield&output=embed",
  );
});

test("googleMapsEmbedUrl returns null instead of throwing on a lone surrogate", () => {
  // A lone high surrogate (no matching low surrogate) makes encodeURIComponent
  // throw a URIError — this can happen from a paste mid-edit in the editor's
  // address field, so the caller must get null, not a crash.
  assert.equal(googleMapsEmbedUrl("Main St \uD800 Springfield"), null);
});
