"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { MediaMap, MediaRef, VideoAspect, VideoBlock } from "@/lib/api-types";
import { isValidVideo, parseVideoUrl, videoWatchUrl } from "@/lib/video";

import { Field, KickerField } from "./block-form";
import { MediaField } from "./media-field";

const ASPECT_OPTIONS: { value: VideoAspect; label: string }[] = [
  { value: "16:9", label: "16:9 (widescreen)" },
  { value: "4:3", label: "4:3" },
  { value: "1:1", label: "1:1 (square)" },
  { value: "9:16", label: "9:16 (vertical)" },
];

/**
 * Editor form for the `video` block (build-out plan rich-blocks §6.7). The
 * host pastes a normal YouTube/Vimeo watch or share URL; `parseVideoUrl`
 * (`src/lib/video.ts`, mirroring the Go regexes) extracts
 * `provider`/`video_id`/`vimeo_hash` from it. We never store or send the raw
 * URL — only the parsed, allow-listed fields.
 */
export function VideoForm({
  block,
  onChange,
  eventId,
  media,
  onMediaUploaded,
}: {
  block: VideoBlock;
  onChange: (patch: Partial<VideoBlock>) => void;
  eventId: string;
  media: MediaMap;
  onMediaUploaded: (id: string, ref: MediaRef) => void;
}) {
  const hasVideo = isValidVideo(block);
  const [urlInput, setUrlInput] = useState(hasVideo ? videoWatchUrl(block) : "");
  const [touched, setTouched] = useState(false);

  const parsed = useMemo(() => (urlInput.trim() ? parseVideoUrl(urlInput) : null), [urlInput]);

  function handleUrlChange(value: string) {
    setUrlInput(value);
    setTouched(true);
    const result = value.trim() ? parseVideoUrl(value) : null;
    if (result) {
      onChange({ provider: result.provider, video_id: result.video_id, vimeo_hash: result.vimeo_hash });
    }
    // If it doesn't parse, we leave the stored fields unchanged so a
    // previously-valid video isn't clobbered by a bad paste.
  }

  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="video" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="video-heading">
        <Input id="video-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>

      <Field label="Video link" htmlFor="video-url">
        <Input
          id="video-url"
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…"
          value={urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
      </Field>
      {parsed ? (
        <p className="text-sm text-muted-foreground">
          {parsed.provider === "youtube" ? "YouTube video detected." : "Vimeo video detected."}
        </p>
      ) : touched && urlInput.trim() ? (
        <p role="alert" className="text-sm text-destructive">
          Paste a YouTube or Vimeo link.
        </p>
      ) : hasVideo ? (
        <p className="text-sm text-muted-foreground">Currently set to a {block.provider === "youtube" ? "YouTube" : "Vimeo"} video.</p>
      ) : null}
      <p className="text-sm text-muted-foreground">The video must be public or unlisted.</p>

      <Field label="Aspect ratio" htmlFor="video-aspect">
        <NativeSelect
          id="video-aspect"
          value={block.aspect}
          onChange={(e) => onChange({ aspect: e.target.value as VideoAspect })}
        >
          {ASPECT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="Caption" htmlFor="video-caption">
        <Input id="video-caption" maxLength={200} value={block.caption} onChange={(e) => onChange({ caption: e.target.value })} />
      </Field>

      <div className="grid gap-1.5">
        <p className="text-sm font-medium">Poster image (optional)</p>
        <p className="text-sm text-muted-foreground">Shown before the guest presses play. Falls back to a themed placeholder.</p>
        <MediaField
          eventId={eventId}
          preview={block.poster_media_id ? media[block.poster_media_id] ?? null : null}
          onUploaded={(id, ref) => {
            onMediaUploaded(id, ref);
            onChange({ poster_media_id: id });
          }}
        />
        {block.poster_media_id && (
          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => onChange({ poster_media_id: "" })}>
            Remove poster
          </Button>
        )}
      </div>
    </div>
  );
}
