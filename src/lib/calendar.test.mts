import assert from "node:assert/strict";
import { test } from "node:test";

import { buildIcs, googleCalendarUrl, type CalendarInfo } from "./calendar.ts";

const NOW = new Date("2026-01-15T10:00:00.000Z");
const PAGE_URL = "https://seeuthere.at/priya-arjun";

function timedInfo(overrides: Partial<CalendarInfo> = {}): CalendarInfo {
  return {
    title: "Priya & Arjun's Wedding",
    slug: "priya-arjun",
    blockId: "blk_datetime_1",
    startsAt: "2026-06-20T16:30:00.000Z",
    endsAt: "2026-06-20T20:00:00.000Z",
    allDay: false,
    startLocal: "2026-06-20T22:00",
    endLocal: "2026-06-21T01:30",
    timezone: "Asia/Kolkata",
    location: "The Grand Hall, Mumbai",
    ...overrides,
  };
}

test("buildIcs produces a well-formed VCALENDAR/VEVENT with UTC instants", () => {
  const ics = buildIcs(timedInfo(), PAGE_URL, NOW);
  const lines = ics.split("\r\n");

  assert.equal(lines[0], "BEGIN:VCALENDAR");
  assert.equal(lines[1], "VERSION:2.0");
  assert.ok(lines.includes("PRODID:-//See You There//EN"));
  assert.ok(lines.includes("CALSCALE:GREGORIAN"));
  assert.ok(lines.includes("METHOD:PUBLISH"));
  assert.ok(lines.includes("BEGIN:VEVENT"));
  assert.ok(lines.includes("UID:priya-arjun-blk_datetime_1@seeuthere.at"));
  assert.ok(lines.includes("DTSTAMP:20260115T100000Z"));
  assert.ok(lines.includes("DTSTART:20260620T163000Z"));
  assert.ok(lines.includes("DTEND:20260620T200000Z"));
  assert.ok(lines.includes("SUMMARY:Priya & Arjun's Wedding"));
  assert.ok(lines.includes("LOCATION:The Grand Hall\\, Mumbai"));
  assert.ok(lines.includes(`URL:${PAGE_URL}`));
  assert.ok(lines.includes("END:VEVENT"));
  assert.equal(lines.at(-2), "END:VCALENDAR");
  assert.equal(ics.endsWith("\r\n"), true);
});

test("buildIcs defaults the end time to start + 1 hour when ends_at is null", () => {
  const ics = buildIcs(timedInfo({ endsAt: null }), PAGE_URL, NOW);
  assert.ok(ics.includes("DTSTART:20260620T163000Z"));
  assert.ok(ics.includes("DTEND:20260620T173000Z"));
});

test("buildIcs omits LOCATION when there is no location block", () => {
  const ics = buildIcs(timedInfo({ location: "" }), PAGE_URL, NOW);
  assert.equal(ics.includes("LOCATION:"), false);
});

test("buildIcs renders all-day events as VALUE=DATE with an exclusive end date", () => {
  const ics = buildIcs(
    timedInfo({
      allDay: true,
      startLocal: "2026-06-20T00:00",
      endLocal: "2026-06-21T00:00",
    }),
    PAGE_URL,
    NOW,
  );
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20260620"));
  // end_local's date (21st) + 1 day, exclusive end per RFC 5545.
  assert.ok(ics.includes("DTEND;VALUE=DATE:20260622"));
});

test("buildIcs all-day single-day event (no end_local) ends the day after start", () => {
  const ics = buildIcs(timedInfo({ allDay: true, startLocal: "2026-06-20T00:00", endLocal: "" }), PAGE_URL, NOW);
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20260620"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20260621"));
});

test("buildIcs all-day end date rolls over into the next month/year correctly", () => {
  const ics = buildIcs(
    timedInfo({ allDay: true, startLocal: "2026-12-31T00:00", endLocal: "2026-12-31T00:00" }),
    PAGE_URL,
    NOW,
  );
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261231"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20270101"));
});

test("buildIcs escapes backslashes, semicolons, commas and newlines in TEXT properties", () => {
  const ics = buildIcs(
    timedInfo({
      title: "Reception; drinks, dancing \\ dinner\nSee you there!",
      location: "",
    }),
    PAGE_URL,
    NOW,
  );
  assert.ok(ics.includes("SUMMARY:Reception\\; drinks\\, dancing \\\\ dinner\\nSee you there!"));
});

test("buildIcs folds long lines at 75 octets with a single-space continuation prefix", () => {
  const longLocation = "A".repeat(120);
  const ics = buildIcs(timedInfo({ location: longLocation }), PAGE_URL, NOW);
  const physicalLines = ics.split("\r\n");
  for (const line of physicalLines) {
    assert.ok(Buffer.byteLength(line, "utf8") <= 75, `line exceeds 75 octets: ${line}`);
  }
  // The folded LOCATION property spans a continuation line starting with a space.
  assert.ok(physicalLines.some((l) => l.startsWith(" ") && l.includes("AAA")));
});

test("buildIcs folding never splits a multi-byte UTF-8 character", () => {
  const ics = buildIcs(timedInfo({ location: "café".repeat(30) }), PAGE_URL, NOW);
  for (const line of ics.split("\r\n")) {
    // A split multi-byte sequence would produce an unpaired replacement/invalid
    // character when the bytes are round-tripped through UTF-8.
    const bytes = Buffer.from(line, "utf8");
    assert.equal(bytes.toString("utf8").includes("�"), false);
  }
});

test("googleCalendarUrl builds a TEMPLATE action link with UTC dates and encoded params", () => {
  const url = googleCalendarUrl(timedInfo(), PAGE_URL);
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, "https://calendar.google.com/calendar/render");
  assert.equal(parsed.searchParams.get("action"), "TEMPLATE");
  assert.equal(parsed.searchParams.get("text"), "Priya & Arjun's Wedding");
  assert.equal(parsed.searchParams.get("dates"), "20260620T163000Z/20260620T200000Z");
  assert.equal(parsed.searchParams.get("details"), PAGE_URL);
  assert.equal(parsed.searchParams.get("location"), "The Grand Hall, Mumbai");
  assert.equal(parsed.searchParams.get("ctz"), "Asia/Kolkata");
});

test("googleCalendarUrl uses a bare YYYYMMDD/YYYYMMDD date range for all-day events", () => {
  const url = googleCalendarUrl(
    timedInfo({ allDay: true, startLocal: "2026-06-20T00:00", endLocal: "2026-06-21T00:00" }),
    PAGE_URL,
  );
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("dates"), "20260620/20260622");
});

test("googleCalendarUrl omits location cleanly when there is none", () => {
  const url = googleCalendarUrl(timedInfo({ location: "" }), PAGE_URL);
  assert.equal(new URL(url).searchParams.get("location"), "");
});
