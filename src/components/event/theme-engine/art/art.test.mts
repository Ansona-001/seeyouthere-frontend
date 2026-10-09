import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { artClearance } from "../ornament-keys.ts";
import { ART } from "./registry.ts";

const HERE = new URL(".", import.meta.url);

// Pinned from `artRegistry` in seeyouthere-backend/internal/content/theme_registry.go
// (min colours, max colours, foil allowed, placements). The next test parses the Go
// file and fails if the two drift, so update both together.
const BACKEND: Record<string, { min: number; max: number; foil: boolean; placements: string[] }> = {
  olive_branches: { min: 3, max: 4, foil: false, placements: ["corners", "top_corners", "bottom_corners"] },
  botanical_wash: { min: 2, max: 4, foil: false, placements: ["corners", "top_corners"] },
  confetti: { min: 2, max: 6, foil: false, placements: ["hero", "edges", "scatter"] },
  balloons: { min: 2, max: 4, foil: false, placements: ["hero_top", "top_corners"] },
  stepped_arches: { min: 0, max: 1, foil: true, placements: ["hero"] },
  deco_fans: { min: 0, max: 1, foil: true, placements: ["bottom_corners", "corners"] },
  clouds: { min: 1, max: 3, foil: false, placements: ["top", "scatter"] },
  open_door_plants: { min: 2, max: 3, foil: false, placements: ["hero", "bottom_corners"] },
  terrazzo_chips: { min: 2, max: 6, foil: false, placements: ["scatter", "edges"] },
  riso_shapes: { min: 2, max: 3, foil: false, placements: ["corners", "scatter"] },
  mirror_ball: { min: 1, max: 2, foil: true, placements: ["hero_top"] },
  sparkles: { min: 1, max: 2, foil: true, placements: ["scatter", "hero"] },
  printers_corners: { min: 1, max: 1, foil: true, placements: ["corners"] },
  daisies: { min: 2, max: 3, foil: false, placements: ["corners", "edges"] },
};
const ALL_PLACEMENTS = ["hero", "hero_top", "top", "edges", "scatter", "corners", "top_corners", "bottom_corners"];
const PALETTE = ["#112233", "#445566", "#778899", "#AABBCC", "#DDEEFF", "#102030", "#405060", "#708090"];

function render(key: string, placement: string, colors: readonly string[], extra: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(createElement(ART[key], { placement, colors, region: "page", density: "dense", ...extra }));
}
const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

test("the registry covers exactly the backend's art keys", () => {
  assert.deepEqual(Object.keys(ART).sort(), Object.keys(BACKEND).sort());
});

test("the pinned list still matches the backend registry file", () => {
  const go = readFileSync(new URL("../../../../../../seeyouthere-backend/internal/content/theme_registry.go", import.meta.url), "utf8");
  const start = go.indexOf("var artRegistry");
  const block = go.slice(start, go.indexOf("\n}\n", start));
  const parsed = [...block.matchAll(/"(\w+)":\s*\{(\d+), (\d+), (true|false), (?:true|false), placements\(([^)]*)\)/g)];
  assert.equal(parsed.length, Object.keys(BACKEND).length);
  for (const [, key, min, max, foil, pl] of parsed) {
    const want = BACKEND[key];
    assert.ok(want, key);
    assert.deepEqual([want.min, want.max, want.foil], [Number(min), Number(max), foil === "true"], key);
    assert.deepEqual([...pl.matchAll(/"(\w+)"/g)].map((m) => m[1]).sort(), [...want.placements].sort(), key);
  }
});

test("every key renders every placement at every palette size without throwing", () => {
  for (const [key, spec] of Object.entries(BACKEND)) {
    for (const placement of spec.placements) {
      for (let n = spec.min; n <= spec.max; n++) {
        const html = render(key, placement, PALETTE.slice(0, n));
        assert.ok(html.startsWith("<div"), `${key}/${placement}/${n}`);
        assert.ok(html.includes("<svg"), `${key}/${placement}/${n}`);
        assert.ok(html.includes('aria-hidden="true"'), `${key}/${placement}`);
        // Colours reach the drawing only through the --aN custom properties on the root.
        assert.ok(!html.replace(/^<div[^>]*>/, "").includes("#112233"), `${key}/${placement}/${n}`);
      }
      if (spec.foil) {
        const html = render(key, placement, [], { paint: "foil" });
        assert.ok(html.includes("--a1:url(#ev-foil-grad)"), `${key}/${placement}`);
      }
    }
  }
});

test("colours cycle through --a1..--a8", () => {
  const html = render("olive_branches", "corners", PALETTE.slice(0, 3));
  assert.ok(html.includes("--a1:#112233;--a2:#445566;--a3:#778899;--a4:#112233"));
  assert.ok(html.includes("--a8:#445566"));
});

test("unknown placements render nothing and hostile input never reaches the markup", () => {
  assert.equal(Object.hasOwn(ART, "constructor"), false);
  for (const [key, spec] of Object.entries(BACKEND)) {
    for (const bad of ["", "nope", "__proto__", "constructor", "Corners", "corners "]) {
      assert.equal(render(key, bad, PALETTE.slice(0, spec.min)), "", `${key}/${bad}`);
    }
    // Placements the backend does not allow for this key are also dropped.
    for (const p of ALL_PLACEMENTS.filter((p) => !spec.placements.includes(p))) {
      assert.equal(render(key, p, PALETTE.slice(0, spec.min)), "", `${key}/${p}`);
    }
  }
  const evil = render("olive_branches", "corners", ["#123456", "red;}</style><script>", "#ABCDEF"], { density: '"><x>' });
  assert.ok(!evil.includes("<script"));
  assert.ok(!evil.includes("red"));
  assert.ok(!evil.includes("<x>"));
  assert.ok(evil.includes('data-ev-density="normal"'));
});

test("density is an enum on the root", () => {
  for (const d of ["sparse", "normal", "dense"]) {
    assert.ok(render("confetti", "hero", PALETTE.slice(0, 5), { density: d }).includes(`data-ev-density="${d}"`));
  }
  assert.ok(render("confetti", "hero", PALETTE.slice(0, 5), { density: undefined }).includes('data-ev-density="normal"'));
});

test("the mirror ball clip path id is unique per mount", () => {
  const a = render("mirror_ball", "hero_top", PALETTE.slice(0, 2));
  assert.ok(!/id="ev-mb-clip"/.test(a));
  const id = /<clipPath id="([^"]+)"/.exec(a)?.[1];
  assert.ok(id?.startsWith("ev-mb-clip-"));
  assert.ok(a.includes(`clip-path="url(#${id})"`));
  const props = { placement: "hero_top", colors: PALETTE.slice(0, 2), region: "hero" as const };
  const both = renderToStaticMarkup(createElement("div", null, createElement(ART.mirror_ball, props), createElement(ART.mirror_ball, props)));
  const ids = [...both.matchAll(/<clipPath id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
});

test("tiled placements get unique pattern ids", () => {
  const html = render("confetti", "scatter", PALETTE.slice(0, 5));
  const ids = [...html.matchAll(/<pattern id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) assert.ok(html.includes(`fill="url(#${id})"`));
});

test("budgets: unique SVG <= 30 KB, <= 600 nodes, <= 80 ev-draw per file; draw hooks are well formed", () => {
  for (const file of readdirSync(new URL("shapes/", HERE)).filter((f) => f.endsWith(".ts"))) {
    const key = file.replace(/\.ts$/, "");
    const { placements, max } = BACKEND[key];
    for (const placement of placements) {
      const html = render(key, placement, PALETTE.slice(0, max));
      assert.ok(count(html, /<[a-zA-Z]/g) <= 600, `${key}/${placement}: nodes`);
    }
    const drawings = [...readFileSync(new URL(`shapes/${file}`, HERE), "utf8").matchAll(/export const \w+: SvgNode = (.*);/g)].map((m) => m[1]);
    assert.ok(drawings.length > 0, file);
    let bytes = 0;
    for (const d of drawings) {
      bytes += Buffer.byteLength(d);
      assert.ok(count(d, /"ev-draw"/g) <= 80, `${file}: ev-draw`);
      assert.equal(count(d, /className:"ev-draw"/g), count(d, /className:"ev-draw",pathLength:"1",style:\{"--i":"\d+"\}/g), `${file}: ev-draw hooks`);
    }
    // Source bytes are an upper bound for the unique markup a key ships.
    assert.ok(bytes <= 30 * 1024, `${file}: ${bytes} bytes`);
  }
});

test("no filter, foreign object, script, image or external reference anywhere under art/", () => {
  const forbidden = [/<filter/i, /filter\s*[:=]/i, /fe(Turbulence|GaussianBlur|DisplacementMap)/i, /foreignObject/i, /<script/i, /<image/i, /\bhref\b/i, /javascript:/i, /@import/i, /dangerouslySetInnerHTML/];
  const walk = (dir: URL): URL[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : [new URL(e.name, dir)]));
  const files = walk(HERE).filter((f) => /\.(ts|tsx|mts)$/.test(f.pathname) && !f.pathname.endsWith("art.test.mts"));
  assert.ok(files.length >= 17);
  for (const url of files) {
    const src = readFileSync(url, "utf8");
    for (const re of forbidden) assert.ok(!re.test(src), `${url.pathname}: ${re}`);
    // The only url(#...) targets: the foil gradient, the mirror ball's clip path and the tile pattern built in layout.ts.
    for (const m of src.matchAll(/url\(([^)]*)\)/g)) assert.match(m[1], /^#(ev-foil-grad|ev-mb-clip|\$\{patternId\})$/, `${url.pathname}: ${m[0]}`);
  }
});

test("every drawing paints only through --aN, --hl, --sh or the foil gradient", () => {
  for (const file of readdirSync(new URL("shapes/", HERE))) {
    const src = readFileSync(new URL(`shapes/${file}`, HERE), "utf8");
    for (const m of src.matchAll(/\b(?:fill|stroke):"([^"]+)"/g)) {
      assert.match(m[1], /^(none|var\(--(a[1-8]|hl|sh),#[0-9A-Fa-f]{6}\)|url\(#ev-foil-grad\).*|url\(#ev-mb-clip\))$/, `${file}: ${m[0]}`);
    }
  }
});

test("clearance reaches the text column for the keys that reserve it", () => {
  const drawn = (key: string) => Object.hasOwn(ART, key);
  const layer = (art: string, placement: string, region: "page" | "hero" = "page") => ({ kind: "art", art, placement, region, colors: [] }) as never;
  assert.deepEqual(artClearance([layer("olive_branches", "corners")], drawn), { top: 118, bottom: 70, reserve: 0 });
  assert.deepEqual(artClearance([layer("mirror_ball", "hero_top", "hero")], drawn), { top: 0, bottom: 0, reserve: 236 });
  assert.deepEqual(artClearance([layer("open_door_plants", "bottom_corners")], drawn), { top: 0, bottom: 170, reserve: 0 });
  assert.deepEqual(artClearance([layer("clouds", "top")], drawn), { top: 120, bottom: 0, reserve: 0 });
  assert.deepEqual(artClearance([layer("balloons", "hero_top", "hero")], drawn), { top: 0, bottom: 0, reserve: 0 });
});
