"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";

import { downscaleToJpeg } from "@/components/event/photo-upload";
import { BADGE_MAX, sanitizeBadge } from "@/components/event/theme-engine/ornament-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api";
import type {
  Block,
  CountdownBlock,
  DressCodeBlock,
  FaqBlock,
  FaqItem,
  FieldDef,
  GalleryBlock,
  GuestPhotosBlock,
  HeroBlock,
  ImageBlock,
  LinkItem,
  LinksBlock,
  LocationBlock,
  Media,
  MediaMap,
  MediaRef,
  Occasion,
  PeopleBlock,
  RsvpBlock,
  RsvpFieldToggle,
  ScheduleBlock,
  ScheduleItem,
  TextBlock,
  VideoBlock,
  WishesBlock,
} from "@/lib/api-types";

import { MediaField } from "./media-field";
import { PeopleForm } from "./people-form";
import { VideoForm } from "./video-form";
import { WishesForm } from "./wishes-form";

type OnChange<B extends Block> = (patch: Partial<B>) => void;

/**
 * Dispatches to a per-block-type form (build-out plan §3.1, §11.4). Limits
 * here (`maxLength`, item counts) mirror the server's validator; the server
 * still enforces everything independently on save.
 */
export function BlockForm({
  block,
  occasion,
  eventId,
  media,
  onChange,
  onMediaUploaded,
}: {
  block: Block;
  occasion: Occasion | null;
  eventId: string;
  media: MediaMap;
  onChange: (patch: Partial<Block>) => void;
  onMediaUploaded: (id: string, ref: MediaRef) => void;
}) {
  switch (block.type) {
    case "hero":
      return <HeroForm block={block} onChange={onChange as OnChange<HeroBlock>} eventId={eventId} media={media} onMediaUploaded={onMediaUploaded} />;
    case "text":
      return <TextForm block={block} onChange={onChange as OnChange<TextBlock>} />;
    case "datetime":
      return <DatetimeForm block={block} onChange={onChange as OnChange<typeof block>} />;
    case "location":
      return <LocationForm block={block} onChange={onChange as OnChange<LocationBlock>} />;
    case "schedule":
      return <ScheduleForm block={block} onChange={onChange as OnChange<ScheduleBlock>} />;
    case "image":
      return <ImageForm block={block} onChange={onChange as OnChange<ImageBlock>} eventId={eventId} media={media} onMediaUploaded={onMediaUploaded} />;
    case "gallery":
      return <GalleryForm block={block} onChange={onChange as OnChange<GalleryBlock>} eventId={eventId} media={media} onMediaUploaded={onMediaUploaded} />;
    case "dress_code":
      return <DressCodeForm block={block} onChange={onChange as OnChange<DressCodeBlock>} />;
    case "links":
      return <LinksForm block={block} onChange={onChange as OnChange<LinksBlock>} />;
    case "faq":
      return <FaqForm block={block} onChange={onChange as OnChange<FaqBlock>} />;
    case "countdown":
      return <CountdownForm block={block} onChange={onChange as OnChange<CountdownBlock>} />;
    case "rsvp":
      return <RsvpBlockForm block={block} occasion={occasion} onChange={onChange as OnChange<RsvpBlock>} />;
    case "guest_photos":
      return <GuestPhotosForm block={block} onChange={onChange as OnChange<GuestPhotosBlock>} />;
    case "people":
      return (
        <PeopleForm
          block={block}
          onChange={onChange as OnChange<PeopleBlock>}
          eventId={eventId}
          media={media}
          onMediaUploaded={onMediaUploaded}
        />
      );
    case "video":
      return (
        <VideoForm
          block={block}
          onChange={onChange as OnChange<VideoBlock>}
          eventId={eventId}
          media={media}
          onMediaUploaded={onMediaUploaded}
        />
      );
    case "wishes":
      return <WishesForm block={block} onChange={onChange as OnChange<WishesBlock>} />;
    default:
      return null;
  }
}

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/** Shared "kicker" input (small accent-font label above the block's heading), used by every heading-bearing block form. */
export function KickerField({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: string;
  onChange: (kicker: string) => void;
}) {
  return (
    <Field label="Small label above the heading" htmlFor={`${idPrefix}-kicker`}>
      <Input id={`${idPrefix}-kicker`} maxLength={60} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function HeroForm({
  block,
  onChange,
  eventId,
  media,
  onMediaUploaded,
}: {
  block: HeroBlock;
  onChange: OnChange<HeroBlock>;
  eventId: string;
  media: MediaMap;
  onMediaUploaded: (id: string, ref: MediaRef) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="hero" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Title" htmlFor="hero-title">
        <Input
          id="hero-title"
          required
          maxLength={120}
          value={block.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </Field>
      <Field label="Subtitle" htmlFor="hero-subtitle">
        <Input id="hero-subtitle" maxLength={200} value={block.subtitle} onChange={(e) => onChange({ subtitle: e.target.value })} />
      </Field>
      <Field label="Badge text (optional)" htmlFor="hero-badge">
        <Input
          id="hero-badge"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby="hero-badge-hint"
          value={block.badge ?? ""}
          onChange={(e) => onChange({ badge: sanitizeBadge(e.target.value) })}
        />
        <p id="hero-badge-hint" className="text-sm text-muted-foreground">
          Up to {BADGE_MAX} characters, such as initials (A&amp;T) or an age (30). Letters, digits and &amp; · + - only.
          Shown by themes with a monogram, numeral or seal.
        </p>
      </Field>
      <div className="grid gap-1.5">
        <Label>Photo</Label>
        <MediaField
          eventId={eventId}
          preview={block.image ? media[block.image.media_id] ?? null : null}
          onUploaded={(id, ref) => {
            onMediaUploaded(id, ref);
            onChange({ image: { media_id: id, alt: block.image?.alt ?? "" } });
          }}
        />
        {block.image && (
          <>
            <Input
              placeholder="Describe the photo (for screen readers)"
              maxLength={200}
              value={block.image.alt}
              onChange={(e) => onChange({ image: { media_id: block.image!.media_id, alt: e.target.value } })}
            />
            <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => onChange({ image: null })}>
              Remove photo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function TextForm({ block, onChange }: { block: TextBlock; onChange: OnChange<TextBlock> }) {
  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="text" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="text-heading">
        <Input id="text-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <Field label="Body" htmlFor="text-body">
        <Textarea
          id="text-body"
          required
          maxLength={5000}
          rows={5}
          value={block.body}
          onChange={(e) => onChange({ body: e.target.value })}
        />
      </Field>
    </div>
  );
}

function DatetimeForm({
  block,
  onChange,
}: {
  block: Extract<Block, { type: "datetime" }>;
  onChange: OnChange<Extract<Block, { type: "datetime" }>>;
}) {
  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [block.timezone];
    }
  }, [block.timezone]);

  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="dt" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="dt-heading">
        <Input id="dt-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <Field label="Starts" htmlFor="dt-start">
        <Input
          id="dt-start"
          type="datetime-local"
          required
          value={block.start_local}
          onChange={(e) => onChange({ start_local: e.target.value })}
        />
      </Field>
      <Field label="Ends (optional)" htmlFor="dt-end">
        <Input id="dt-end" type="datetime-local" value={block.end_local} onChange={(e) => onChange({ end_local: e.target.value })} />
      </Field>
      <Field label="Time zone" htmlFor="dt-tz">
        <NativeSelect
          id="dt-tz"
          value={block.timezone}
          onChange={(e) => onChange({ timezone: e.target.value })}
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="flex items-center gap-3">
        <Switch id="dt-allday" checked={block.all_day} onCheckedChange={(v) => onChange({ all_day: v })} />
        <Label htmlFor="dt-allday">All day</Label>
      </div>
    </div>
  );
}

function LocationForm({ block, onChange }: { block: LocationBlock; onChange: OnChange<LocationBlock> }) {
  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="loc" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="loc-heading">
        <Input id="loc-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <Field label="Venue name" htmlFor="loc-name">
        <Input id="loc-name" required maxLength={120} value={block.name} onChange={(e) => onChange({ name: e.target.value })} />
      </Field>
      <Field label="Address" htmlFor="loc-address">
        <Input id="loc-address" maxLength={300} value={block.address} onChange={(e) => onChange({ address: e.target.value })} />
      </Field>
      <Field label="Map link (optional, https)" htmlFor="loc-map">
        <Input
          id="loc-map"
          type="url"
          pattern="https://.*"
          maxLength={2048}
          placeholder="https://maps.google.com/…"
          value={block.map_url}
          onChange={(e) => onChange({ map_url: e.target.value })}
        />
      </Field>
      <Field label="Notes" htmlFor="loc-notes">
        <Textarea id="loc-notes" maxLength={500} value={block.notes} onChange={(e) => onChange({ notes: e.target.value })} />
      </Field>
    </div>
  );
}

function ScheduleForm({ block, onChange }: { block: ScheduleBlock; onChange: OnChange<ScheduleBlock> }) {
  function updateItem(index: number, patch: Partial<ScheduleItem>) {
    onChange({ items: block.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  }
  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="sched" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="sched-heading">
        <Input id="sched-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <div className="flex flex-col gap-3">
        {block.items.map((item, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-input bg-card p-3">
            <div className="flex gap-2">
              <Input
                type="time"
                className="w-28"
                value={item.time}
                onChange={(e) => updateItem(i, { time: e.target.value })}
              />
              <Input
                required
                maxLength={120}
                placeholder="Title"
                value={item.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove this schedule item"
                disabled={block.items.length <= 1}
                onClick={() => onChange({ items: block.items.filter((_, idx) => idx !== i) })}
              >
                <Trash2Icon />
              </Button>
            </div>
            <Input
              maxLength={300}
              placeholder="Description (optional)"
              value={item.description}
              onChange={(e) => updateItem(i, { description: e.target.value })}
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={block.items.length >= 30}
        onClick={() => onChange({ items: [...block.items, { time: "", title: "", description: "" }] })}
      >
        <PlusIcon data-icon="inline-start" />
        Add item
      </Button>
    </div>
  );
}

function ImageForm({
  block,
  onChange,
  eventId,
  media,
  onMediaUploaded,
}: {
  block: ImageBlock;
  onChange: OnChange<ImageBlock>;
  eventId: string;
  media: MediaMap;
  onMediaUploaded: (id: string, ref: MediaRef) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <MediaField
        eventId={eventId}
        preview={block.media_id ? media[block.media_id] ?? null : null}
        onUploaded={(id, ref) => {
          onMediaUploaded(id, ref);
          onChange({ media_id: id });
        }}
      />
      <Field label="Alt text" htmlFor="img-alt">
        <Input id="img-alt" maxLength={200} value={block.alt} onChange={(e) => onChange({ alt: e.target.value })} />
      </Field>
      <Field label="Caption" htmlFor="img-caption">
        <Input id="img-caption" maxLength={200} value={block.caption} onChange={(e) => onChange({ caption: e.target.value })} />
      </Field>
    </div>
  );
}

const GALLERY_MAX_IMAGES = 24;
const GALLERY_MAX_BATCH = 10;

function galleryUploadErrorMessage(err: unknown): string {
  if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
    return "Photo uploads aren't available yet. Please check back soon.";
  }
  return err instanceof ApiError ? err.message : "Couldn't process or upload that image.";
}

function GalleryForm({
  block,
  onChange,
  eventId,
  media,
  onMediaUploaded,
}: {
  block: GalleryBlock;
  onChange: OnChange<GalleryBlock>;
  eventId: string;
  media: MediaMap;
  onMediaUploaded: (id: string, ref: MediaRef) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failures, setFailures] = useState<{ name: string; message: string }[]>([]);
  const [skipped, setSkipped] = useState(0);
  const remainingSlots = Math.max(0, GALLERY_MAX_IMAGES - block.images.length);
  const uploading = progress !== null;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList).slice(0, Math.min(GALLERY_MAX_BATCH, remainingSlots));
    setSkipped(fileList.length - picked.length);
    setFailures([]);
    if (picked.length === 0) {
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    // Uploaded one at a time: the server's image processor runs with
    // concurrency 1 for the whole host (build-out plan §11.4), so parallel
    // uploads would only queue or time out. Each `images` array appended to
    // locally so onChange only ever receives slots with a real media_id —
    // never an empty placeholder that would fail the content validator.
    let currentImages = block.images;
    const batchFailures: { name: string; message: string }[] = [];
    for (let i = 0; i < picked.length; i++) {
      const file = picked[i];
      setProgress({ done: i, total: picked.length });
      try {
        const jpeg = await downscaleToJpeg(file);
        const { media: uploaded } = await api<{ media: Media }>(`/v1/events/${eventId}/media`, {
          method: "POST",
          body: jpeg,
          headers: { "Content-Type": "image/jpeg" },
        });
        onMediaUploaded(uploaded.id, { src: uploaded.src, width: uploaded.width, height: uploaded.height });
        currentImages = [...currentImages, { media_id: uploaded.id, alt: "" }];
        onChange({ images: currentImages });
      } catch (err) {
        batchFailures.push({ name: file.name, message: galleryUploadErrorMessage(err) });
      }
    }
    setFailures(batchFailures);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="gal" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="gal-heading">
        <Input id="gal-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <Field label="Layout" htmlFor="gal-display">
        <NativeSelect
          id="gal-display"
          value={block.display}
          onChange={(e) => onChange({ display: e.target.value as GalleryBlock["display"] })}
        >
          <option value="grid">Grid</option>
          <option value="carousel">Carousel</option>
        </NativeSelect>
      </Field>
      <div className="flex flex-col gap-3">
        {block.images.map((img, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-input bg-card p-3">
            <MediaField
              eventId={eventId}
              preview={img.media_id ? media[img.media_id] ?? null : null}
              onUploaded={(id, ref) => {
                onMediaUploaded(id, ref);
                onChange({ images: block.images.map((it, idx) => (idx === i ? { ...it, media_id: id } : it)) });
              }}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Alt text"
                maxLength={200}
                value={img.alt}
                onChange={(e) => onChange({ images: block.images.map((it, idx) => (idx === i ? { ...it, alt: e.target.value } : it)) })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove this photo"
                onClick={() => onChange({ images: block.images.filter((_, idx) => idx !== i) })}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading || remainingSlots === 0}
          className="sr-only"
          id={inputId}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          disabled={uploading || remainingSlots === 0}
          onClick={() => inputRef.current?.click()}
        >
          <PlusIcon data-icon="inline-start" />
          {progress ? `Uploading ${progress.done + 1} of ${progress.total}…` : "Add photos"}
        </Button>
        {remainingSlots === 0 && (
          <p className="text-sm text-muted-foreground">Gallery is full — remove a photo to add more.</p>
        )}
        {skipped > 0 && (
          <p role="status" className="text-sm text-muted-foreground">
            {skipped === 1
              ? "1 photo wasn't added — a gallery can hold up to 24 photos."
              : `${skipped} photos weren't added — a gallery can hold up to 24 photos.`}
          </p>
        )}
        {failures.length > 0 && (
          <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
            {failures.map((f, idx) => (
              <p key={`${f.name}-${idx}`}>
                {f.name}: {f.message}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DressCodeForm({ block, onChange }: { block: DressCodeBlock; onChange: OnChange<DressCodeBlock> }) {
  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="dc" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="dc-heading">
        <Input id="dc-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <Field label="Details" htmlFor="dc-body">
        <Textarea id="dc-body" required maxLength={1000} value={block.body} onChange={(e) => onChange({ body: e.target.value })} />
      </Field>
    </div>
  );
}

function LinksForm({ block, onChange }: { block: LinksBlock; onChange: OnChange<LinksBlock> }) {
  function updateItem(index: number, patch: Partial<LinkItem>) {
    onChange({ items: block.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  }
  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="links" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="links-heading">
        <Input id="links-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <Field label="Intro" htmlFor="links-body">
        <Textarea id="links-body" maxLength={500} value={block.body} onChange={(e) => onChange({ body: e.target.value })} />
      </Field>
      <div className="flex flex-col gap-3">
        {block.items.map((item, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-input bg-card p-3">
            <Input
              required
              maxLength={80}
              placeholder="Label"
              value={item.label}
              onChange={(e) => updateItem(i, { label: e.target.value })}
            />
            <div className="flex gap-2">
              <Input
                type="url"
                required
                pattern="https://.*"
                maxLength={2048}
                placeholder="https://…"
                value={item.url}
                onChange={(e) => updateItem(i, { url: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove this link"
                disabled={block.items.length <= 1}
                onClick={() => onChange({ items: block.items.filter((_, idx) => idx !== i) })}
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={block.items.length >= 12}
        onClick={() => onChange({ items: [...block.items, { label: "", url: "" }] })}
      >
        <PlusIcon data-icon="inline-start" />
        Add link
      </Button>
    </div>
  );
}

function FaqForm({ block, onChange }: { block: FaqBlock; onChange: OnChange<FaqBlock> }) {
  function updateItem(index: number, patch: Partial<FaqItem>) {
    onChange({ items: block.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  }
  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="faq" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="faq-heading">
        <Input id="faq-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <div className="flex flex-col gap-3">
        {block.items.map((item, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-input bg-card p-3">
            <div className="flex gap-2">
              <Input
                required
                maxLength={200}
                placeholder="Question"
                value={item.question}
                onChange={(e) => updateItem(i, { question: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove this question"
                disabled={block.items.length <= 1}
                onClick={() => onChange({ items: block.items.filter((_, idx) => idx !== i) })}
              >
                <Trash2Icon />
              </Button>
            </div>
            <Textarea maxLength={2000} placeholder="Answer" value={item.answer} onChange={(e) => updateItem(i, { answer: e.target.value })} />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={block.items.length >= 30}
        onClick={() => onChange({ items: [...block.items, { question: "", answer: "" }] })}
      >
        <PlusIcon data-icon="inline-start" />
        Add question
      </Button>
    </div>
  );
}

function CountdownForm({ block, onChange }: { block: CountdownBlock; onChange: OnChange<CountdownBlock> }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Counts down to your event&rsquo;s date &amp; time block.</p>
      <KickerField idPrefix="cd" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="cd-heading">
        <Input id="cd-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
    </div>
  );
}

function GuestPhotosForm({ block, onChange }: { block: GuestPhotosBlock; onChange: OnChange<GuestPhotosBlock> }) {
  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="gp" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="gp-heading">
        <Input id="gp-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <Field label="Intro" htmlFor="gp-body">
        <Textarea id="gp-body" maxLength={500} value={block.body} onChange={(e) => onChange({ body: e.target.value })} />
      </Field>
      <div className="flex items-center gap-3">
        <Switch id="gp-open" checked={block.open} onCheckedChange={(v) => onChange({ open: v })} />
        <Label htmlFor="gp-open">Let guests upload photos</Label>
      </div>
    </div>
  );
}

function RsvpBlockForm({
  block,
  occasion,
  onChange,
}: {
  block: RsvpBlock;
  occasion: Occasion | null;
  onChange: OnChange<RsvpBlock>;
}) {
  const occasionFields: FieldDef[] = occasion?.rsvp_fields ?? [];

  function toggleField(key: string, enabled: boolean) {
    if (enabled) {
      if (block.fields.some((f) => f.key === key)) return;
      onChange({ fields: [...block.fields, { key, required: false }] });
    } else {
      onChange({ fields: block.fields.filter((f) => f.key !== key) });
    }
  }

  function updateFieldToggle(key: string, patch: Partial<RsvpFieldToggle>) {
    onChange({ fields: block.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)) });
  }

  function addQuestion() {
    if (block.questions.length >= 5) return;
    const n = block.questions.length + 1;
    onChange({
      questions: [
        ...block.questions,
        { key: `q_custom${n}`, label: "", type: "text", required: false, max_length: 200, options: [], min: null, max: null, help: "" },
      ],
    });
  }

  function updateQuestion(index: number, patch: Partial<FieldDef>) {
    onChange({ questions: block.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <KickerField idPrefix="rsvp" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="rsvp-heading">
        <Input id="rsvp-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>
      <Field label="Intro" htmlFor="rsvp-body">
        <Textarea id="rsvp-body" maxLength={1000} value={block.body} onChange={(e) => onChange({ body: e.target.value })} />
      </Field>
      <Field label="RSVP deadline (optional)" htmlFor="rsvp-deadline">
        <Input
          id="rsvp-deadline"
          type="datetime-local"
          value={block.deadline_local}
          onChange={(e) => onChange({ deadline_local: e.target.value })}
        />
      </Field>
      <Field label="Guest capacity (heads, optional)" htmlFor="rsvp-capacity">
        <Input
          id="rsvp-capacity"
          type="number"
          min={1}
          max={10000}
          value={block.capacity ?? ""}
          onChange={(e) => onChange({ capacity: e.target.value === "" ? null : Number(e.target.value) })}
        />
      </Field>
      <Field label="Max party size per RSVP" htmlFor="rsvp-party">
        <Input
          id="rsvp-party"
          type="number"
          min={1}
          max={20}
          required
          value={block.max_party_size}
          onChange={(e) => onChange({ max_party_size: Number(e.target.value) || 1 })}
        />
      </Field>

      {occasionFields.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Ask guests about</p>
          <div className="flex flex-col gap-2">
            {occasionFields.map((f) => {
              const toggle = block.fields.find((t) => t.key === f.key);
              return (
                <div key={f.key} className="flex items-center justify-between gap-2 rounded-xl border border-input bg-card p-2.5">
                  <div className="flex items-center gap-3">
                    <Switch checked={Boolean(toggle)} onCheckedChange={(v) => toggleField(f.key, v)} />
                    <span className="text-sm">{f.label}</span>
                  </div>
                  {toggle && (
                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={toggle.required}
                        onChange={(e) => updateFieldToggle(f.key, { required: e.target.checked })}
                      />
                      Required
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Your own questions (up to 5)</p>
        <div className="flex flex-col gap-2">
          {block.questions.map((q, i) => (
            <div key={q.key} className="flex flex-col gap-2 rounded-xl border border-input bg-card p-2.5">
              <div className="flex gap-2">
                <Input
                  placeholder="Question"
                  maxLength={120}
                  value={q.label}
                  onChange={(e) => updateQuestion(i, { label: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove this question"
                  onClick={() => onChange({ questions: block.questions.filter((_, idx) => idx !== i) })}
                >
                  <Trash2Icon />
                </Button>
              </div>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, { required: e.target.checked })} />
                Required
              </label>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" disabled={block.questions.length >= 5} onClick={addQuestion}>
          <PlusIcon data-icon="inline-start" />
          Add question
        </Button>
      </div>
    </div>
  );
}
