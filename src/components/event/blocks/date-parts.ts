const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}$/;
const ORDINAL_SUFFIX = { one: "st", two: "nd", few: "rd", other: "th" } as const;

/**
 * Splits a wall-clock `YYYY-MM-DDTHH:MM` value into "Nov", "7th", "2026" for
 * the three-part date line. Reads the literal numbers (no timezone maths) and
 * returns `null` for anything that is not a real calendar date.
 */
export function dateParts(local: string): { month: string; day: string; year: string } | null {
  const m = LOCAL_PATTERN.exec(local);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date);
  const rule = new Intl.PluralRules("en-US", { type: "ordinal" }).select(d) as keyof typeof ORDINAL_SUFFIX;
  return { month, day: `${d}${ORDINAL_SUFFIX[rule]}`, year: String(y) };
}
