const UNTITLED = "Untitled event";

// Suggestions stay short so the link reads well next to the domain; the API allows up to 50.
const SUGGESTED_MAX = 40;

/** Word appended to the names so the link says what the event is ("alex-and-sam-wedding"). */
const OCCASION_SUFFIX: Readonly<Record<string, string>> = {
  wedding: "wedding",
  engagement: "engagement",
  birthday: "birthday",
  "baby-shower": "baby-shower",
  housewarming: "housewarming",
};

/**
 * Suggests an event link from its title and occasion ("Alex & Sam", wedding -> "alex-and-sam-wedding"):
 * lower-case letters, digits and single hyphens, 3-40 characters (the API allows 3-50). Apostrophes are
 * dropped rather than turned into hyphens ("Sam's birthday" -> "sams-birthday"), and the occasion word is
 * only added when the title doesn't already say it. Returns "" when nothing usable is left (no title, the
 * untitled placeholder, or non-Latin text), so the host picks their own. Availability is still checked by
 * the API.
 */
export function suggestSlug(title: string, occasionSlug?: string): string {
  if (title.trim() === UNTITLED) return "";
  const base = title
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (base === "") return "";

  const suffix = occasionSlug ? OCCASION_SUFFIX[occasionSlug] : undefined;
  const addSuffix = suffix !== undefined && !base.includes(suffix);
  const room = addSuffix ? SUGGESTED_MAX - suffix.length - 1 : SUGGESTED_MAX;
  const names = base.slice(0, room).replace(/-+$/, "");
  const slug = addSuffix && names !== "" ? `${names}-${suffix}` : names;
  return slug.length >= 3 ? slug : "";
}
