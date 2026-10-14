import assert from "node:assert/strict";
import { test } from "node:test";

import { nowLocalInput } from "./local-time.ts";

const instant = new Date("2026-10-13T20:30:00Z");

test("nowLocalInput reads the wall clock of the given time zone", () => {
  assert.equal(nowLocalInput("UTC", instant), "2026-10-13T20:30");
  assert.equal(nowLocalInput("Asia/Dubai", instant), "2026-10-14T00:30"); // UTC+4, next day
  assert.equal(nowLocalInput("America/Los_Angeles", instant), "2026-10-13T13:30"); // UTC-7 (PDT)
});

test("nowLocalInput never shows hour 24 at midnight", () => {
  assert.equal(nowLocalInput("UTC", new Date("2026-10-13T00:05:00Z")), "2026-10-13T00:05");
});

test("nowLocalInput falls back to the local zone for an empty or unknown zone", () => {
  const local = nowLocalInput(undefined, instant);
  assert.match(local, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  assert.equal(nowLocalInput("", instant), local);
  assert.equal(nowLocalInput("Not/AZone", instant), local);
});
