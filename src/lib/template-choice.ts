import type { TemplateSummary } from "./api-types.ts";

/**
 * The template a new invite starts from. Each candidate (e.g. a `?template=` param, then a saved draft) is
 * untrusted and only honoured when it is the slug of a template in `templates`; otherwise the occasion's
 * first free template (or the first one) is used. `templates` must be non-empty.
 */
export function chooseTemplate(
  templates: readonly TemplateSummary[],
  ...candidates: readonly (string | null | undefined)[]
): TemplateSummary {
  for (const slug of candidates) {
    if (typeof slug !== "string" || slug === "") continue;
    const match = templates.find((t) => t.slug === slug);
    if (match) return match;
  }
  return templates.find((t) => !t.is_premium) ?? templates[0];
}
