import assert from "node:assert/strict";
import { test } from "node:test";

import { parsePassUrl, passUrl } from "./pass.ts";
import { siteUrl } from "./site.ts";

const TOKEN = "A".repeat(20) + "-_" + "b".repeat(21);
const ORIGIN = siteUrl().origin;

test("round-trips a pass url", () => {
  assert.equal(TOKEN.length, 43);
  assert.equal(passUrl(TOKEN), `${ORIGIN}/checkin#${TOKEN}`);
  assert.equal(parsePassUrl(passUrl(TOKEN)), TOKEN);
});

test("rejects other origins, paths and lookalikes", () => {
  assert.equal(parsePassUrl(`https://evil.example/checkin#${TOKEN}`), null);
  assert.equal(parsePassUrl(`${ORIGIN}.evil.example/checkin#${TOKEN}`), null);
  assert.equal(parsePassUrl(`${ORIGIN}@evil.example/checkin#${TOKEN}`), null);
  assert.equal(parsePassUrl(`${ORIGIN}/other#${TOKEN}`), null);
  assert.equal(parsePassUrl(`${ORIGIN}/checkin?x=1#${TOKEN}`), null);
  assert.equal(parsePassUrl(`javascript:alert(1)`), null);
});

test("rejects malformed tokens and surrounding text", () => {
  assert.equal(parsePassUrl(`${ORIGIN}/checkin#`), null);
  assert.equal(parsePassUrl(`${ORIGIN}/checkin#${TOKEN.slice(1)}`), null);
  assert.equal(parsePassUrl(`${ORIGIN}/checkin#${TOKEN}A`), null);
  assert.equal(parsePassUrl(`${ORIGIN}/checkin#${TOKEN.slice(1)}!`), null);
  assert.equal(parsePassUrl(` ${ORIGIN}/checkin#${TOKEN}`), null);
  assert.equal(parsePassUrl(`${ORIGIN}/checkin#${TOKEN}\n`), null);
  assert.equal(parsePassUrl(""), null);
});
