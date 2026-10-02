/**
 * Add-to-calendar: fully client-side `.ics` generation and a Google
 * Calendar deep link (build-out plan rich-blocks extension §6.5). Pure
 * functions only — no DOM, no server-only imports — so this module is safe
 * to import from both the client `AddToCalendar` component and its tests.
 *
 * All instants (`startsAt`/`endsAt`) are RFC 3339 strings the backend
 * already computed from the `datetime` block's own timezone (build-out
 * plan §1.14, rich-blocks §2 "ends_at"); this module never performs
 * timezone math itself, only UTC formatting of instants the server gave us
 * and, for all-day events, literal date-part arithmetic on the block's
 * wall-clock `start_local`/`end_local`.
 */

export type CalendarInfo = {
  title: string;
  slug: string;
  blockId: string;
  /** RFC 3339 instant — the event's `starts_at`. */
  startsAt: string;
  /** RFC 3339 instant — the event's `ends_at`, or null to default to a 1-hour duration. */
  endsAt: string | null;
  allDay: boolean;
  /** Wall-clock `YYYY-MM-DDTHH:MM` (or a bare `YYYY-MM-DD`), used only for all-day date parts. */
  startLocal: string;
  /** Wall-clock local time, or `""`. */
  endLocal: string;
  /** IANA zone name, used only as the Google Calendar `ctz` hint. */
  timezone: string;
  /** "" when there is no location block. */
  location: string;
};

const DEFAULT_DURATION_MS = 60 * 60 * 1000; // 1 hour, used when the block has no end time.

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** `YYYYMMDDTHHMMSSZ` for an RFC 3339 instant. */
function formatInstantUtc(iso: string): string {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

/** The `YYYY-MM-DD` date part of a wall-clock local string. */
function dateOnly(local: string): string {
  return local.slice(0, 10);
}

function compactDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

/** `dateStr` ("YYYY-MM-DD") + 1 day, computed on a UTC `Date` (never the browser's zone). */
function plusOneDayCompact(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return `${next.getUTCFullYear()}${pad2(next.getUTCMonth() + 1)}${pad2(next.getUTCDate())}`;
}

function endInstantIso(info: CalendarInfo): string {
  return info.endsAt ?? new Date(new Date(info.startsAt).getTime() + DEFAULT_DURATION_MS).toISOString();
}

/** `dates=` value for the Google Calendar template link. */
function datesParam(info: CalendarInfo): string {
  if (info.allDay) {
    const start = dateOnly(info.startLocal);
    const endBase = info.endLocal ? dateOnly(info.endLocal) : start;
    return `${compactDate(start)}/${plusOneDayCompact(endBase)}`;
  }
  return `${formatInstantUtc(info.startsAt)}/${formatInstantUtc(endInstantIso(info))}`;
}

/**
 * RFC 5545 §3.3.11 TEXT escaping: backslash, semicolon and comma are
 * backslash-escaped, newlines become the literal `\n`, and bare CRs are
 * dropped. Order matters — backslashes must be escaped first so the
 * backslashes this function inserts are never themselves re-escaped.
 */
function escapeIcsText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * RFC 5545 §3.1 line folding: no physical line may exceed 75 octets
 * (UTF-8 bytes), and continuation lines start with a single space (which
 * itself counts toward that line's 75-octet limit). Splits on code points
 * so a multi-byte UTF-8 sequence is never cut in half.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const ch of line) {
    const chBytes = encoder.encode(ch).length;
    if (currentBytes + chBytes > 75) {
      out.push(current);
      current = ` ${ch}`;
      currentBytes = 1 + chBytes;
    } else {
      current += ch;
      currentBytes += chBytes;
    }
  }
  out.push(current);
  return out.join("\r\n");
}

/** Builds an RFC 5545 `.ics` document (CRLF line endings) for one event. */
export function buildIcs(info: CalendarInfo, pageUrl: string, now: Date): string {
  const host = new URL(pageUrl).host;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//See You There//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${info.slug}-${info.blockId}@${host}`,
    `DTSTAMP:${formatInstantUtc(now.toISOString())}`,
  ];

  if (info.allDay) {
    const start = dateOnly(info.startLocal);
    const endBase = info.endLocal ? dateOnly(info.endLocal) : start;
    lines.push(`DTSTART;VALUE=DATE:${compactDate(start)}`);
    lines.push(`DTEND;VALUE=DATE:${plusOneDayCompact(endBase)}`);
  } else {
    lines.push(`DTSTART:${formatInstantUtc(info.startsAt)}`);
    lines.push(`DTEND:${formatInstantUtc(endInstantIso(info))}`);
  }

  lines.push(`SUMMARY:${escapeIcsText(info.title)}`);
  if (info.location) lines.push(`LOCATION:${escapeIcsText(info.location)}`);
  lines.push(`DESCRIPTION:${escapeIcsText(pageUrl)}`);
  lines.push(`URL:${pageUrl}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Builds a Google Calendar "add event" template link — URL construction only, no API key. */
export function googleCalendarUrl(info: CalendarInfo, pageUrl: string): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: info.title,
    dates: datesParam(info),
    details: pageUrl,
    location: info.location,
    ctz: info.timezone,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
