const UNTITLED = "Untitled event";

/**
 * Suggests an event link from its title ("Alex & Sam" -> "alex-and-sam"): lower-case letters, digits and
 * single hyphens, 3-50 characters, as the API requires. Returns "" when nothing usable is left (no title,
 * the untitled placeholder, or non-Latin text), so the host picks their own. Availability is still
 * checked by the API.
 */
export function suggestSlug(title: string): string {
  if (title.trim() === UNTITLED) return "";
  const slug = title
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
  return slug.length >= 3 ? slug : "";
}
