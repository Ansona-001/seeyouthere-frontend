import assert from "node:assert/strict";
import { test } from "node:test";

import { dateParts } from "./date-parts.ts";

test("splits a local date into month, ordinal day and year", () => {
  assert.deepEqual(dateParts("2026-11-07T16:00"), { month: "Nov", day: "7th", year: "2026" });
});

test("ordinal suffixes", () => {
  const day = (d: number) => dateParts(`2026-12-${String(d).padStart(2, "0")}T00:00`)?.day;
  assert.deepEqual([1, 2, 3, 4].map(day), ["1st", "2nd", "3rd", "4th"]);
  assert.deepEqual([11, 12, 13].map(day), ["11th", "12th", "13th"]);
  assert.deepEqual([21, 22, 23].map(day), ["21st", "22nd", "23rd"]);
  assert.equal(day(31), "31st");
});

test("invalid input gives null", () => {
  for (const bad of ["", "nonsense", "2026-02-30T10:00", "2026-13-01T10:00", "2026-11-07", "2026-11-07T25:00x"]) {
    assert.equal(dateParts(bad), null, bad);
  }
});
