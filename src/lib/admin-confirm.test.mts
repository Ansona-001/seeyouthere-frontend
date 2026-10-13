import assert from "node:assert/strict";
import { test } from "node:test";

import {
  adminErrorMessage,
  emailConfirmMatches,
  eventConfirmMatches,
  eventConfirmTarget,
  templateErrorMessage,
} from "./admin-confirm.ts";

test("email match ignores case and surrounding space", () => {
  assert.equal(emailConfirmMatches("  Ann@Example.com ", "ann@example.com"), true);
  assert.equal(emailConfirmMatches("ann@example.org", "ann@example.com"), false);
  assert.equal(emailConfirmMatches("", "ann@example.com"), false);
  assert.equal(emailConfirmMatches("", ""), false);
});

test("event confirm uses the slug exactly", () => {
  assert.equal(eventConfirmMatches("summer-bbq", "summer-bbq"), true);
  assert.equal(eventConfirmMatches("Summer-BBQ", "summer-bbq"), false);
  assert.equal(eventConfirmMatches(" summer-bbq", "summer-bbq"), false);
  assert.equal(eventConfirmMatches("delete", "summer-bbq"), false);
});

test("event without a slug falls back to 'delete'", () => {
  assert.equal(eventConfirmTarget(null), "delete");
  assert.equal(eventConfirmTarget(""), "delete");
  assert.equal(eventConfirmMatches("delete", null), true);
  assert.equal(eventConfirmMatches("Delete", null), false);
  assert.equal(eventConfirmMatches("", null), false);
});

test("error mapping", () => {
  const e = (status: number, code: string) => ({ status, code, message: "server text" });
  assert.match(adminErrorMessage(e(400, "confirm_mismatch")), /doesn't match/);
  assert.match(adminErrorMessage(e(409, "has_admin_role")), /admin role/);
  assert.match(adminErrorMessage(e(409, "user_banned")), /Unban first/);
  assert.match(adminErrorMessage(e(409, "email_taken")), /already uses/);
  assert.match(adminErrorMessage(e(429, "rate_limited")), /Too many/);
  assert.match(adminErrorMessage(e(503, "storage_unavailable")), /event wasn't deleted/);
  assert.equal(adminErrorMessage(e(400, "validation_failed")), "server text");
  assert.match(adminErrorMessage(null), /Couldn't reach/);
});

test("template error mapping", () => {
  const e = (status: number, code: string) => ({ status, code, message: "server text" });
  assert.equal(templateErrorMessage(e(409, "needs_published_version")), "Publish a version first.");
  assert.match(templateErrorMessage(e(409, "version_published")), /can't be deleted/);
  assert.match(templateErrorMessage(e(409, "last_version")), /at least one version/);
  assert.match(templateErrorMessage(e(503, "storage_unavailable")), /Nothing was deleted/);
  assert.match(templateErrorMessage(e(429, "rate_limited")), /Too many/);
  assert.equal(templateErrorMessage(e(400, "validation_failed")), "server text");
  assert.match(templateErrorMessage(null), /Couldn't reach/);
});
