import assert from "node:assert/strict";
import { test } from "node:test";

import type { TemplateSummary } from "./api-types.ts";
import { chooseTemplate } from "./template-choice.ts";

function tpl(slug: string, is_premium: boolean): TemplateSummary {
  return { slug, is_premium } as TemplateSummary;
}

const templates = [tpl("gilt-noir", true), tpl("classic", false), tpl("garden", false)];

test("defaults to the first free template", () => {
  assert.equal(chooseTemplate(templates).slug, "classic");
  assert.equal(chooseTemplate(templates, null, undefined, "").slug, "classic");
});

test("falls back to the first template when all are premium", () => {
  assert.equal(chooseTemplate([tpl("a", true), tpl("b", true)]).slug, "a");
});

test("honours a requested slug that exists, including premium", () => {
  assert.equal(chooseTemplate(templates, "garden").slug, "garden");
  assert.equal(chooseTemplate(templates, "gilt-noir").slug, "gilt-noir");
});

test("ignores unknown slugs and falls back silently", () => {
  assert.equal(chooseTemplate(templates, "nope").slug, "classic");
  assert.equal(chooseTemplate(templates, "__proto__").slug, "classic");
});

test("uses the first valid candidate", () => {
  assert.equal(chooseTemplate(templates, "nope", "garden", "classic").slug, "garden");
});
