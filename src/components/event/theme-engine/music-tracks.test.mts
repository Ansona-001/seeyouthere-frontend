import assert from "node:assert/strict";
import { test } from "node:test";

import { customMusicSrc } from "./music-tracks.ts";

const ev = "0192f3a0-7b1e-7c2d-8a4f-1234567890ab";
const au = "0192f3a0-7b1e-7c2d-8a4f-ba0987654321";

test("customMusicSrc accepts only the canonical media path", () => {
  const ok = `/media/${ev}/${au}/audio.mp3`;
  assert.equal(customMusicSrc(ok), ok);
});

test("customMusicSrc rejects everything else", () => {
  for (const bad of [
    "",
    null,
    undefined,
    1,
    {},
    `https://evil.example/media/${ev}/${au}/audio.mp3`,
    `//evil.example/media/${ev}/${au}/audio.mp3`,
    `/media/${ev}/${au}/audio.mp3?x=1`,
    `/media/${ev}/${au}/audio.mp3#x`,
    `/media/${ev}/${au}/audio.MP3`,
    `/media/${ev}/${au}/image.mp3`,
    `/media/${ev.toUpperCase()}/${au}/audio.mp3`,
    `/media/${ev}/../${au}/audio.mp3`,
    `/media/${ev}/${au}/audio.mp3\n`,
    `/media/${ev}/${au}`,
    `/themes/music-box.mp3`,
  ]) {
    assert.equal(customMusicSrc(bad), null, String(bad));
  }
});
