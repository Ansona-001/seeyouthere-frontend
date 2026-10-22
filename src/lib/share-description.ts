import type { Block } from "./api-types.ts";

const MAX_LENGTH = 200;

/** "2026-11-14T16:00" -> "Sat 14 Nov 2026". The value is wall-clock time, so it is formatted as-is in UTC. */
function dateLabel(startLocal: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(startLocal);
  if (!m) return "";
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

/**
 * The text link previews show under the title: the hero subtitle when the host wrote one, otherwise a line
 * built from the event's date and place, so every event (including already published ones) previews with a
 * useful message and no extra setup.
 */
export function shareDescription(blocks: Block[]): string {
  const hero = blocks.find((b) => b.type === "hero");
  if (hero && hero.subtitle.trim()) return hero.subtitle.trim().slice(0, MAX_LENGTH);

  const datetime = blocks.find((b) => b.type === "datetime");
  const location = blocks.find((b) => b.type === "location");
  const when = datetime ? dateLabel(datetime.start_local) : "";
  const where = location ? location.name.trim() : "";

  const details = [when, where].filter(Boolean).join(" · ");
  const lead = details ? `${details}. ` : "";
  return `${lead}You're invited. Tap to see the details and RSVP.`.slice(0, MAX_LENGTH);
}
