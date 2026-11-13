import type { MetadataRoute } from "next";

import type { OccasionsResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";
import { siteUrl } from "@/lib/site";

// Public marketing pages only. Event pages are deliberately absent: hosts opt into indexing per event,
// and a sitemap would advertise every slug.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl().origin;
  const result = await serverApi<OccasionsResponse>("/v1/occasions", { cache: "force-cache", next: { revalidate: 3600 } });
  const occasions = result.ok ? result.data.occasions : [];

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/create`, changeFrequency: "weekly", priority: 0.8 },
    ...occasions.map((o) => ({
      url: `${base}/create/${encodeURIComponent(o.slug)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/help`, changeFrequency: "monthly", priority: 0.4 },
  ];
}
