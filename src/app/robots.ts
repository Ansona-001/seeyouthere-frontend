import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

// Build-out plan §11.1/§11.5: keep host-only areas and the token-bearing
// invite/RSVP-edit link pages out of any crawl. Public event pages opt in or
// out of indexing individually via `generateMetadata` (`[slug]/page.tsx`),
// based on the event's own `visibility`. /create and /create/<occasion> are
// public marketing pages and stay crawlable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/app", "/admin", "/edit", "/account", "/login", "/*/invite", "/*/rsvp"],
    },
    sitemap: `${siteUrl().origin}/sitemap.xml`,
  };
}
