import assert from "node:assert/strict";
import { test } from "node:test";

import { foilGradient, mirroredFoilStops } from "./foil.ts";
import { ownKey, safeHex, safeHexList, safeInt, safeMediaSrc, safeNumber } from "./safe.ts";
import { isTextureKey, TEXTURE_SIZE, textureUrl } from "./textures.ts";

const INJECTIONS = [
  "",
  "#FFF",
  "#GGGGGG",
  "red",
  "#FFFFFF;",
  "#FFFFFF\n",
  "#FFFFFFFF",
  " #FFFFFF",
  "rgb(0,0,0)",
  "var(--x)",
  "url(javascript:alert(1))",
  "#FFFFFF;background:url(//evil)",
  '#FFFFFF"/><script>alert(1)</script>',
  "</style><script>",
  "#ＦＦＦＦＦＦ", // full-width letters
  "#FFFFF\u0000",
];

test("safeHex accepts only #RRGGBB", () => {
  assert.equal(safeHex("#A1b2C3"), "#A1b2C3");
  assert.equal(safeHex("#000000"), "#000000");
  for (const bad of INJECTIONS) assert.equal(safeHex(bad), null, JSON.stringify(bad));
  for (const bad of [null, undefined, 0, 1, {}, [], true, ["#FFFFFF"]]) assert.equal(safeHex(bad), null);
});

test("safeHexList enforces length bounds and rejects a single bad entry", () => {
  assert.deepEqual(safeHexList(["#111111", "#222222"], 1, 3), ["#111111", "#222222"]);
  assert.equal(safeHexList([], 1, 3), null);
  assert.equal(safeHexList(["#111111", "#222222", "#333333", "#444444"], 1, 3), null);
  assert.equal(safeHexList(["#111111", "red"], 1, 3), null);
  assert.equal(safeHexList("#111111", 1, 3), null);
  assert.equal(safeHexList(undefined, 0, 3), null);
  assert.deepEqual(safeHexList([], 0, 3), []);
});

test("safeNumber / safeInt clamp and reject non-finite values", () => {
  assert.equal(safeNumber(0.5, 0, 1, 9), 0.5);
  assert.equal(safeNumber(-3, 0, 1, 9), 0);
  assert.equal(safeNumber(1e308, 0, 1, 9), 1);
  assert.equal(safeNumber(Number.NaN, 0, 1, 9), 9);
  assert.equal(safeNumber(Number.POSITIVE_INFINITY, 0, 1, 9), 9);
  assert.equal(safeNumber("0.5", 0, 1, 9), 9);
  assert.equal(safeNumber(null, 0, 1, 9), 9);
  assert.equal(safeNumber(undefined, 0, 1, 9), 9);
  assert.equal(safeInt(12.6, 0, 32, 0), 13);
  assert.equal(safeInt(99, 0, 32, 0), 32);
  assert.equal(safeInt(Number.NaN, 0, 32, 7), 7);
});

test("safeMediaSrc accepts only same-origin /media paths", () => {
  assert.equal(safeMediaSrc("/media/templates/01926a00-0000-7000-8000-000000000007/1/background"), "/media/templates/01926a00-0000-7000-8000-000000000007/1/background");
  assert.equal(safeMediaSrc("/media/abc_DEF-1"), "/media/abc_DEF-1");
  for (const bad of [
    "",
    "/media/",
    "media/x",
    "//evil.com/media/x",
    "https://evil.com/media/x",
    "/media/../etc/passwd",
    "/media/a.b",
    "/media//evil",
    "/media/x?y=1",
    "/media/x#y",
    "/media/x\n",
    "/media/x y",
    "/media/%2e%2e/x",
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "/other/x",
    `/media/${"a".repeat(300)}`,
    null,
    undefined,
    42,
  ]) {
    assert.equal(safeMediaSrc(bad), null, String(bad));
  }
});

test("ownKey ignores inherited keys", () => {
  const table = { a: 1, b: 2 };
  assert.equal(ownKey(table, "a"), "a");
  for (const bad of ["constructor", "__proto__", "toString", "hasOwnProperty", "A", "a ", "", 1, null]) {
    assert.equal(ownKey(table, bad), null, String(bad));
  }
});

test("foilGradient mirrors 3-5 valid stops into a 115deg gradient", () => {
  assert.equal(
    foilGradient(["#111111", "#222222", "#333333"]),
    "linear-gradient(115deg, #111111 0%, #222222 25%, #333333 50%, #222222 75%, #111111 100%)",
  );
  const five = foilGradient(["#000001", "#000002", "#000003", "#000004", "#000005"]);
  assert.ok(five?.startsWith("linear-gradient(115deg, #000001 0%"));
  assert.ok(five?.endsWith("#000001 100%)"));
  assert.equal(five?.match(/#00000\d/g)?.length, 9);
  assert.deepEqual(
    mirroredFoilStops(["#111111", "#222222", "#333333"])?.map((s) => s.at),
    [0, 25, 50, 75, 100],
  );
});

test("foilGradient rejects bad input", () => {
  assert.equal(foilGradient(undefined), null);
  assert.equal(foilGradient([]), null);
  assert.equal(foilGradient(["#111111", "#222222"]), null);
  assert.equal(foilGradient(["#111111", "#222222", "#333333", "#444444", "#555555", "#666666"]), null);
  assert.equal(foilGradient(["#111111", "#222222", "red"]), null);
  assert.equal(foilGradient(["#111111", "#222222", "#333333);background:url(//evil"]), null);
  assert.equal(foilGradient("#111111"), null);
});

const decode = (url: string | null): string => {
  assert.ok(url);
  const match = /^url\("data:image\/svg\+xml,([^"]+)"\)$/.exec(url);
  assert.ok(match, "url() wrapper with no stray quote");
  return decodeURIComponent(match[1]);
};

test("textureUrl returns an SVG data URL for every key", () => {
  for (const key of Object.keys(TEXTURE_SIZE)) {
    const url = textureUrl(
      key,
      ["#111111", "#222222", "#333333"],
      ["#111111", "#222222", "#333333", "#444444", "#555555"],
    );
    const svg = decode(url);
    assert.ok(svg.startsWith("<svg xmlns="), key);
    assert.ok(svg.endsWith("</svg>"), key);
    assert.ok(!/<script|javascript:|<foreignObject|onload/i.test(svg), key);
  }
});

test("textureUrl rejects unknown keys", () => {
  for (const bad of ["", "Grain", "grain ", "grain;x", "constructor", "__proto__", "toString", "none", null, undefined, 1, {}]) {
    assert.equal(textureUrl(bad), null, String(bad));
    assert.equal(isTextureKey(bad), false, String(bad));
  }
});

test("textureUrl needs valid colours for watercolour and foil", () => {
  assert.equal(textureUrl("watercolour"), null);
  assert.equal(textureUrl("watercolour", ["#111111", "#222222"]), null);
  assert.equal(textureUrl("watercolour", ["#111111", "#222222", "#333333", "#444444"]), null);
  assert.equal(textureUrl("foil"), null);
  assert.equal(textureUrl("foil", undefined, ["#111111", "#222222"]), null);
  for (const bad of INJECTIONS) {
    assert.equal(textureUrl("watercolour", ["#111111", "#222222", bad]), null, JSON.stringify(bad));
    assert.equal(textureUrl("foil", undefined, ["#111111", "#222222", bad]), null, JSON.stringify(bad));
  }
  const wc = decode(textureUrl("watercolour", ["#AA0000", "#00BB00", "#0000CC"]));
  assert.ok(wc.includes('fill="#AA0000"') && wc.includes('fill="#00BB00"') && wc.includes('fill="#0000CC"'));
  const foil = decode(textureUrl("foil", undefined, ["#AA0000", "#00BB00", "#0000CC"]));
  assert.ok(foil.includes('stop-color="#AA0000"') && foil.includes('stop-color="#0000CC"'));
});

test("textureUrl ignores colours for textures that take none", () => {
  assert.equal(textureUrl("grain", ["not hex"]), textureUrl("grain"));
});
