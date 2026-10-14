/**
 * The current moment as a `datetime-local` value ("YYYY-MM-DDTHH:mm") on the wall clock of `timeZone`, for
 * the `min` of a date picker so nothing in the past can be picked. An event's start is a wall-clock time
 * in the event's own time zone, so "now" has to be read in that zone too. An empty or unknown zone falls
 * back to the browser's own.
 */
export function nowLocalInput(timeZone?: string, now: Date = new Date()): string {
  const parts = (zone?: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);

  let p: Intl.DateTimeFormatPart[];
  try {
    p = parts(timeZone || undefined);
  } catch {
    p = parts(undefined);
  }
  const get = (type: string) => p.find((x) => x.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
