import assert from "node:assert/strict";
import { test } from "node:test";

import type { Block } from "./api-types.ts";
import { shareDescription } from "./share-description.ts";

const hero = (subtitle: string) => ({ id: "h", type: "hero", subtitle }) as unknown as Block;
const datetime = (start_local: string) => ({ id: "d", type: "datetime", start_local }) as unknown as Block;
const location = (name: string) => ({ id: "l", type: "location", name }) as unknown as Block;
const rsvp = () => ({ id: "r", type: "rsvp" }) as unknown as Block;

test("uses the hero subtitle when the host wrote one", () => {
  assert.equal(shareDescription([hero("  Join us for cake  "), datetime("2026-11-14T16:00")]), "Join us for cake");
});

test("builds a line from the date and place otherwise, asking for an RSVP only when there is one", () => {
  assert.equal(
    shareDescription([hero(""), datetime("2026-11-14T16:00"), location("Fort Kochi"), rsvp()]),
    "Sat, 14 Nov 2026 · Fort Kochi. You're invited. Tap to see the details and RSVP.",
  );
  assert.equal(
    shareDescription([hero(""), datetime("2026-11-14T16:00"), location("Fort Kochi")]),
    "Sat, 14 Nov 2026 · Fort Kochi. You're invited. Tap to see the details.",
  );
});

test("falls back to a plain invitation line with no date or place", () => {
  assert.equal(shareDescription([]), "You're invited. Tap to see the details.");
  assert.equal(shareDescription([rsvp()]), "You're invited. Tap to see the details and RSVP.");
});

test("ignores an invalid date", () => {
  assert.equal(shareDescription([datetime("nope")]), "You're invited. Tap to see the details.");
});
