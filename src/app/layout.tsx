import type { Metadata, Viewport } from "next";
import { Geist_Mono, Gloock } from "next/font/google";
import "./globals.css";

// eventFontVariables already carries Figtree/Bricolage Grotesque (the site's
// UI font, also two of the eight fonts an event theme can use) — loaded once
// in lib/fonts.ts so we never ship the same Google Font twice.
import { eventFontVariables } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";

// next/font downloads this at build time and serves it from our own domain.
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// The app's display face (--font-heading in globals.css). One weight, preloaded.
// Not part of the event-theme font allowlist in lib/fonts.ts.
const gloock = Gloock({ variable: "--font-gloock", subsets: ["latin"], weight: "400", display: "swap" });

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // No canonical here: it would be inherited by every page, including event pages.
  openGraph: { type: "website", siteName: SITE_NAME, title: SITE_NAME, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image" },
};

// Cream paper, so the mobile browser chrome blends with the page.
export const viewport: Viewport = { themeColor: "#F6F0E4" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${eventFontVariables} ${geistMono.variable} ${gloock.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
