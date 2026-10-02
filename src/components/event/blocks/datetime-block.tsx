import type { DatetimeBlock as DatetimeBlockType } from "@/lib/api-types";
import type { CalendarInfo } from "@/lib/calendar";

import { AddToCalendar } from "../add-to-calendar";
import { BlockHeading } from "../block-heading";
import { EvCard } from "../surface";

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * `start_local`/`end_local` are wall-clock values with no attached instant
 * (build-out plan §1.14 — timezone math is the backend's job at save time).
 * To display them without performing any conversion ourselves, we read the
 * literal Y-M-D/H:M numbers, build a Date from them treated as UTC, and format
 * with `timeZone: "UTC"` so Intl reads back exactly those numbers.
 */
function parseLocal(local: string): Date | null {
  const m = LOCAL_PATTERN.exec(local);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)));
}

function formatLocal(local: string, options: Intl.DateTimeFormatOptions): string | null {
  const date = parseLocal(local);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
}

/** Best-effort zone label (e.g. "PDT"); purely cosmetic, not used for any conversion. */
function zoneAbbreviation(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "short" }).formatToParts(
      new Date(),
    );
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
  } catch {
    return timezone;
  }
}

export function DatetimeBlock({ block, calendar }: { block: DatetimeBlockType; calendar?: CalendarInfo }) {
  const dateLabel = formatLocal(block.start_local, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = block.all_day ? null : formatLocal(block.start_local, { hour: "numeric", minute: "2-digit" });
  const endTimeLabel =
    !block.all_day && block.end_local ? formatLocal(block.end_local, { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <section className="flex flex-col items-center px-2 py-8 text-center">
      <EvCard className="flex flex-col items-center gap-1">
        <BlockHeading kicker={block.kicker} heading={block.heading} />
        {dateLabel && <p className="text-lg text-(--ev-text)">{dateLabel}</p>}
        {timeLabel && (
          <p className="text-(--ev-muted)">
            {timeLabel}
            {endTimeLabel && <> – {endTimeLabel}</>} <span className="text-sm">({zoneAbbreviation(block.timezone)})</span>
          </p>
        )}
        {calendar && <AddToCalendar info={calendar} />}
      </EvCard>
    </section>
  );
}
