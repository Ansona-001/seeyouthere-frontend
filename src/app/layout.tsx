import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

// eventFontVariables already carries Figtree/Bricolage Grotesque (the site's
// UI font, also two of the eight fonts an event theme can use) — loaded once
// in lib/fonts.ts so we never ship the same Google Font twice.
import { eventFontVariables } from "@/lib/fonts";

// next/font downloads this at build time and serves it from our own domain.
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Lets relative OG/Twitter image URLs (e.g. an event's hero photo, served as
// `/media/<event>/<media>/1080.jpg` on this same origin — build-out plan
// §6.2, §10) resolve to absolute URLs in generated metadata.
function siteUrl(): URL {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100");
  } catch {
    return new URL("http://localhost:3100");
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: { default: "See You There", template: "%s · See You There" },
  description: "Free event pages for birthdays, weddings, housewarmings and every other gathering.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${eventFontVariables} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
