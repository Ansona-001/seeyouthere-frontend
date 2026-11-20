import Image from "next/image";
import { MapPinIcon } from "lucide-react";

import type {
  DatetimeBlock,
  FaqBlock,
  LocationBlock,
  MediaMap,
  PeopleBlock,
  ScheduleBlock,
  TextBlock,
} from "@/lib/api-types";
import type { CalendarInfo } from "@/lib/calendar";
import { googleMapsEmbedUrl, googleMapsSearchUrl, isSafeHttpsUrl } from "@/lib/urls";

import { AddToCalendar } from "../add-to-calendar";
import { formatLocal } from "../blocks/datetime-block";
import { clockLabel } from "../blocks/schedule-block";
import { MapEmbed } from "../map-embed";

/** Small accent kicker plus a left-aligned heading; renders nothing when both are empty. */
function SectionHeader({ kicker, heading }: { kicker: string; heading: string }) {
  const title = heading.trim();
  if (!kicker && !title) return null;
  return (
    <div className="mb-8 @min-[640px]/ev:mb-10">
      {kicker && (
        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-(--ev-accent-ink) uppercase">{kicker}</p>
      )}
      {title && (
        <h2 className="text-3xl leading-tight font-semibold text-balance [font-family:var(--ev-font-heading)] @min-[640px]/ev:text-4xl">
          {title}
        </h2>
      )}
    </div>
  );
}

export function TextSection({ block }: { block: TextBlock }) {
  return (
    <>
      <SectionHeader kicker={block.kicker} heading={block.heading} />
      <p className="max-w-3xl text-lg leading-relaxed whitespace-pre-line">{block.body}</p>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string | null }) {
  return (
    <div className="rounded-2xl border border-(--ev-text)/12 bg-(--ev-text)/[0.04] p-5 @min-[640px]/ev:p-6">
      <p className="text-xs font-semibold tracking-[0.2em] text-(--ev-muted) uppercase">{label}</p>
      <p className="mt-2 text-2xl leading-tight font-semibold [font-family:var(--ev-font-heading)] @min-[640px]/ev:text-3xl">
        {value}
      </p>
      {sub && <p className="mt-1 text-(--ev-muted)">{sub}</p>}
    </div>
  );
}

export function DatetimeSection({ block, calendar }: { block: DatetimeBlock; calendar?: CalendarInfo }) {
  const date = formatLocal(block.start_local, { month: "long", day: "numeric", year: "numeric" });
  const weekday = formatLocal(block.start_local, { weekday: "long" });
  const time = block.all_day ? "All day" : formatLocal(block.start_local, { hour: "numeric", minute: "2-digit" });
  const endTime =
    !block.all_day && block.end_local ? formatLocal(block.end_local, { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <>
      <SectionHeader kicker={block.kicker} heading={block.heading} />
      <div className="grid grid-cols-1 gap-4 @min-[480px]/ev:grid-cols-2">
        {date && <Stat label="Date" value={date} sub={weekday} />}
        {time && <Stat label="Time" value={endTime ? `${time} – ${endTime}` : time} sub={block.timezone || null} />}
      </div>
      {calendar && (
        <div className="mt-6">
          <AddToCalendar info={calendar} />
        </div>
      )}
    </>
  );
}

export function LocationSection({ block, interactive }: { block: LocationBlock; interactive: boolean }) {
  const mapHref = isSafeHttpsUrl(block.map_url) ? block.map_url : block.address ? googleMapsSearchUrl(block.address) : null;
  // Built only from our own validated `address` text, never from `map_url` (see googleMapsEmbedUrl).
  const embedSrc = block.address ? googleMapsEmbedUrl(block.address) : null;

  return (
    <>
      <SectionHeader kicker={block.kicker} heading={block.heading} />
      <div className="grid grid-cols-1 gap-8 @min-[640px]/ev:grid-cols-2 @min-[640px]/ev:items-center">
        <div className="flex min-w-0 flex-col items-start gap-3">
          <p className="text-2xl font-semibold break-words [font-family:var(--ev-font-heading)]">{block.name}</p>
          {block.address && <p className="break-words text-(--ev-muted)">{block.address}</p>}
          {block.notes && <p className="whitespace-pre-line text-(--ev-muted)">{block.notes}</p>}
          {mapHref && (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="mt-2 inline-flex min-h-11 items-center rounded-full border border-(--ev-accent-ink) px-5 text-sm font-semibold text-(--ev-accent-ink) transition-colors hover:bg-(--ev-accent-ink)/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ev-accent)"
            >
              Open in Maps
            </a>
          )}
        </div>
        {block.address && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl">
            <MapEmbed
              src={embedSrc}
              title={`Map: ${block.name || block.address}`}
              label={block.address}
              interactive={interactive}
            />
          </div>
        )}
      </div>
    </>
  );
}

export function ScheduleSection({ block }: { block: ScheduleBlock }) {
  return (
    <>
      <SectionHeader kicker={block.kicker} heading={block.heading} />
      <ol className="divide-y divide-(--ev-text)/12 border-y border-(--ev-text)/12">
        {block.items.map((item, index) => (
          <li
            key={index}
            className="grid grid-cols-[4.5rem_1fr] gap-x-4 py-5 @min-[640px]/ev:grid-cols-[8rem_1fr] @min-[640px]/ev:gap-x-8 @min-[640px]/ev:py-6"
          >
            <p className="text-sm font-semibold text-(--ev-accent-ink) tabular-nums @min-[640px]/ev:text-base">
              {item.time ? clockLabel(item.time) : ""}
            </p>
            <div className="min-w-0">
              <p className="text-lg leading-snug font-semibold break-words [font-family:var(--ev-font-heading)] @min-[640px]/ev:text-xl">
                {item.title}
              </p>
              {item.location && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-(--ev-muted)">
                  <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0" />
                  <span>{item.location}</span>
                </p>
              )}
              {item.description && <p className="mt-2 whitespace-pre-line text-(--ev-muted)">{item.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

export function FaqSection({ block }: { block: FaqBlock }) {
  return (
    <>
      <SectionHeader kicker={block.kicker} heading={block.heading} />
      <div className="max-w-3xl divide-y divide-(--ev-text)/12 border-y border-(--ev-text)/12">
        {block.items.map((item, index) => (
          <details key={index} className="group py-4">
            <summary className="cursor-pointer list-none rounded-sm text-lg font-medium marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--ev-accent)">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-2xl leading-none text-(--ev-muted) transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 whitespace-pre-line text-(--ev-muted)">{item.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}

export function PeopleSection({ block, media }: { block: PeopleBlock; media: MediaMap }) {
  return (
    <>
      <SectionHeader kicker={block.kicker} heading={block.heading} />
      <ul className="grid grid-cols-1 gap-8 @min-[480px]/ev:grid-cols-2 @min-[900px]/ev:grid-cols-3">
        {block.people.map((person, index) => {
          const photo = person.photo ? media[person.photo.media_id] : undefined;
          return (
            <li key={index} className="min-w-0">
              {photo && (
                <Image
                  src={photo.src}
                  alt={person.photo?.alt || person.name}
                  width={480}
                  height={480}
                  className="mb-4 aspect-square w-full rounded-2xl object-cover"
                />
              )}
              <p className="text-xl font-semibold break-words [font-family:var(--ev-font-heading)]">{person.name}</p>
              {person.role && <p className="mt-0.5 text-sm font-semibold text-(--ev-accent-ink)">{person.role}</p>}
              {person.place && <p className="mt-0.5 text-sm text-(--ev-muted)">{person.place}</p>}
              {person.bio && <p className="mt-3 whitespace-pre-line text-(--ev-muted)">{person.bio}</p>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
