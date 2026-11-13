export const SITE_NAME = "See You There";
export const SITE_DESCRIPTION = "Free event pages for birthdays, weddings, housewarmings and every other gathering.";

/** This site's public origin, used to resolve absolute OG URLs, canonicals and the sitemap. */
export function siteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100");
  } catch {
    return new URL("http://localhost:3100");
  }
}
