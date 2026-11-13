import Script from "next/script";
import { headers } from "next/headers";

// Cloudflare Web Analytics: cookieless, so no consent banner. Rendered only on public marketing pages,
// never on event/invite/RSVP pages, so private event slugs and token links are never sent to a third party.
// The token is read at runtime (not NEXT_PUBLIC_) so it can change without rebuilding the image; it is
// not a secret. Unset (local dev, preview) renders nothing.
export async function Analytics() {
  const token = process.env.CF_BEACON_TOKEN;
  if (!token || process.env.NODE_ENV !== "production") return null;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      nonce={nonce}
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
