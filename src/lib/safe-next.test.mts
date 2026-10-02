import assert from "node:assert/strict";
import { test } from "node:test";

import { safeNextPath } from "./safe-next.ts";

test("rejects nullish and empty input", () => {
  assert.equal(safeNextPath(null), null);
  assert.equal(safeNextPath(undefined), null);
  assert.equal(safeNextPath(""), null);
});

test("rejects protocol-relative and absolute URLs", () => {
  assert.equal(safeNextPath("//evil.com"), null);
  assert.equal(safeNextPath("http://evil.com"), null);
  assert.equal(safeNextPath("https://evil.com/path"), null);
  assert.equal(safeNextPath("evil.com"), null);
});

test("rejects backslash tricks", () => {
  assert.equal(safeNextPath("/\\evil.com"), null);
  assert.equal(safeNextPath("\\\\evil.com"), null);
});

test("rejects dot-segment escapes that resolve to protocol-relative output", () => {
  // Each of these starts with a single "/" (passing the naive prefix check)
  // but the browser's URL resolution collapses the dot-segment, leaving a
  // bare "//evil.com" that would be interpreted as protocol-relative.
  assert.equal(safeNextPath("/.//evil.com"), null);
  assert.equal(safeNextPath("/..//evil.com"), null);
  assert.equal(safeNextPath("/%2e//evil.com"), null);
  assert.equal(safeNextPath("/a/..//evil.com"), null);
});

test("accepts normal same-origin paths and preserves search/hash", () => {
  assert.equal(safeNextPath("/dashboard"), "/dashboard");
  assert.equal(safeNextPath("/events/abc-123"), "/events/abc-123");
  assert.equal(safeNextPath("/events/abc-123?tab=guests"), "/events/abc-123?tab=guests");
  assert.equal(safeNextPath("/events/abc-123#section"), "/events/abc-123#section");
  assert.equal(safeNextPath("/events/abc-123?tab=guests#section"), "/events/abc-123?tab=guests#section");
});
