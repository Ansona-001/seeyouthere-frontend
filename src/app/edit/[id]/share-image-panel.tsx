"use client";

import { useId, useState } from "react";

import type { MediaMap, MediaRef, ShareImageSource } from "@/lib/api-types";

import { MediaField } from "./media-field";

const SHARE_ASPECT = 1200 / 630;

/**
 * Picks the image that link previews (chat apps, social posts) show for the event. Hero and site
 * choices save immediately; "Your own image" saves only once its upload has succeeded, so the
 * server never sees a custom choice without an image.
 */
export function SharePanel({
  eventId,
  source,
  mediaId,
  media,
  hasHeroImage,
  heroDrawsPhoto,
  onSave,
  onUploaded,
}: {
  eventId: string;
  source: ShareImageSource;
  mediaId: string | null;
  media: MediaMap;
  hasHeroImage: boolean;
  /** Whether the selected template draws a hero photo (otherwise the Hero form doesn't ask for one). */
  heroDrawsPhoto: boolean;
  onSave: (next: { source: ShareImageSource; mediaId: string | null }) => Promise<boolean>;
  onUploaded: (id: string, ref: MediaRef) => void;
}) {
  const name = useId();
  const [pending, setPending] = useState(false);
  // "Your own image" chosen but nothing uploaded yet; nothing has been sent to the server.
  const [choosingCustom, setChoosingCustom] = useState(false);
  // With no way to add a hero photo (template doesn't draw one and none is set), the hero option is hidden
  // and a stored "hero" choice shows as our image, which is what the preview resolves to anyway.
  const heroOption = hasHeroImage || heroDrawsPhoto;
  const selected: ShareImageSource = choosingCustom || source === "custom" ? "custom" : source === "hero" && !heroOption ? "site" : source;
  const customPreview = source === "custom" && mediaId ? (media[mediaId] ?? null) : null;

  async function run(action: () => Promise<boolean>) {
    if (pending) return false;
    setPending(true);
    try {
      return await action();
    } finally {
      setPending(false);
    }
  }

  async function choose(next: ShareImageSource) {
    if (next === "custom") {
      setChoosingCustom(true);
      return;
    }
    if (next === source && !choosingCustom) return;
    const previous = choosingCustom;
    setChoosingCustom(false);
    const ok = await run(() => onSave({ source: next, mediaId: null }));
    if (!ok && previous) setChoosingCustom(true);
  }

  async function handleUploaded(id: string, ref: MediaRef) {
    onUploaded(id, ref);
    const ok = await run(() => onSave({ source: "custom", mediaId: id }));
    if (ok) setChoosingCustom(false);
  }

  const options: { value: ShareImageSource; label: string; hint: string }[] = [
    ...(heroOption
      ? [
          {
            value: "hero" as const,
            label: "Hero photo",
            hint: hasHeroImage ? "Uses the photo from your Hero section." : "Your Hero section has no photo yet, so this uses our image.",
          },
        ]
      : []),
    { value: "site", label: "See You There image", hint: "Our default image." },
    { value: "custom", label: "Your own image", hint: "Cropped to the shape link previews use." },
  ];

  return (
    <fieldset disabled={pending} className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">Image shown when the link is shared</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 text-sm transition-[background-color,border-color,box-shadow] duration-(--duration-fast) has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-default has-disabled:opacity-60 ${
            selected === o.value ? "border-primary bg-secondary ring-2 ring-ring/40" : "border-input [@media(hover:hover)]:hover:bg-accent"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={selected === o.value}
            onChange={() => choose(o.value)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="flex flex-col">
            <span className="font-medium">{o.label}</span>
            <span className="text-muted-foreground">{o.hint}</span>
          </span>
        </label>
      ))}

      {selected === "custom" && (
        <div className="mt-1">
          <MediaField eventId={eventId} preview={customPreview} onUploaded={handleUploaded} aspect={SHARE_ASPECT} previewAspect={SHARE_ASPECT} />
        </div>
      )}
      <p role="status" className="sr-only">
        {pending ? "Saving…" : ""}
      </p>
    </fieldset>
  );
}
