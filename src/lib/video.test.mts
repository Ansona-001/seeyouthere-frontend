import assert from "node:assert/strict";
import { test } from "node:test";

import { isValidVideo, parseVideoUrl, videoEmbedUrl } from "./video.ts";

test("isValidVideo accepts well-formed ids", () => {
  assert.equal(isValidVideo({ provider: "youtube", video_id: "dQw4w9WgXcQ", vimeo_hash: "" }), true);
  assert.equal(isValidVideo({ provider: "vimeo", video_id: "123456789", vimeo_hash: "" }), true);
  assert.equal(isValidVideo({ provider: "vimeo", video_id: "123456789", vimeo_hash: "abc12345" }), true);
});

test("isValidVideo rejects malformed ids and mismatched fields", () => {
  assert.equal(isValidVideo({ provider: "youtube", video_id: "short", vimeo_hash: "" }), false);
  assert.equal(isValidVideo({ provider: "youtube", video_id: "dQw4w9WgXc<", vimeo_hash: "" }), false);
  assert.equal(isValidVideo({ provider: "youtube", video_id: "dQw4w9WgXcQ", vimeo_hash: "abc12345" }), false);
  assert.equal(isValidVideo({ provider: "vimeo", video_id: "0123", vimeo_hash: "" }), false);
  assert.equal(isValidVideo({ provider: "vimeo", video_id: "1234567890123", vimeo_hash: "" }), false);
  assert.equal(isValidVideo({ provider: "vimeo", video_id: "abc", vimeo_hash: "" }), false);
  assert.equal(isValidVideo({ provider: "dailymotion", video_id: "dQw4w9WgXcQ", vimeo_hash: "" }), false);
});

test("videoEmbedUrl builds the exact allow-listed origins", () => {
  assert.equal(
    videoEmbedUrl({ provider: "youtube", video_id: "dQw4w9WgXcQ", vimeo_hash: "" }),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&playsinline=1",
  );
  assert.equal(
    videoEmbedUrl({ provider: "vimeo", video_id: "123456789", vimeo_hash: "" }),
    "https://player.vimeo.com/video/123456789?autoplay=1&dnt=1",
  );
  assert.equal(
    videoEmbedUrl({ provider: "vimeo", video_id: "123456789", vimeo_hash: "abc12345" }),
    "https://player.vimeo.com/video/123456789?autoplay=1&dnt=1&h=abc12345",
  );
});

test("parseVideoUrl accepts every supported form", () => {
  assert.deepEqual(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), {
    provider: "youtube",
    video_id: "dQw4w9WgXcQ",
    vimeo_hash: "",
  });
  assert.deepEqual(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ"), {
    provider: "youtube",
    video_id: "dQw4w9WgXcQ",
    vimeo_hash: "",
  });
  assert.deepEqual(parseVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"), {
    provider: "youtube",
    video_id: "dQw4w9WgXcQ",
    vimeo_hash: "",
  });
  assert.deepEqual(parseVideoUrl("https://vimeo.com/123456789"), {
    provider: "vimeo",
    video_id: "123456789",
    vimeo_hash: "",
  });
  assert.deepEqual(parseVideoUrl("https://vimeo.com/123456789/abc12345"), {
    provider: "vimeo",
    video_id: "123456789",
    vimeo_hash: "abc12345",
  });
  assert.deepEqual(parseVideoUrl("https://player.vimeo.com/video/123456789?h=abc12345"), {
    provider: "vimeo",
    video_id: "123456789",
    vimeo_hash: "abc12345",
  });
});

test("parseVideoUrl rejects non-https, userinfo, and spoofed/unknown hosts", () => {
  assert.equal(parseVideoUrl("http://www.youtube.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseVideoUrl("https://user:pass@www.youtube.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseVideoUrl("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseVideoUrl("https://evil.com/watch?v=dQw4w9WgXcQ"), null);
  assert.equal(parseVideoUrl("javascript:alert(1)"), null);
  assert.equal(parseVideoUrl("https://www.youtube.com/watch?v=not_valid!"), null);
  assert.equal(parseVideoUrl("not a url"), null);
});
