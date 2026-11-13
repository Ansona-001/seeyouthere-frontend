// Structured data for crawlers. `application/json` script blocks are data, not executable, so the CSP
// doesn't apply. `<` is escaped so no string value can close the tag.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }} />;
}
