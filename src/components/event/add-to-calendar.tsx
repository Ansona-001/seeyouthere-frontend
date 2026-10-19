"use client";

import { useSyncExternalStore } from "react";

import type { CalendarInfo } from "@/lib/calendar";
import { buildIcs, googleCalendarUrl } from "@/lib/calendar";

type Platform = "apple" | "other" | "unknown";

/**
 * iPhone, iPad and Mac are all "apple": iPadOS reports itself as "Macintosh", which is why it needs no
 * separate check. "unknown" is the server render and the first client render, so both pills show and
 * hydration matches; useSyncExternalStore then swaps in the real value without an effect.
 */
function detectPlatform(): Platform {
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? "apple" : "other";
}

const noSubscribe = () => () => {};

/**
 * "Add to calendar" for the `datetime` block (build-out plan rich-blocks extension §6.5). Fully
 * client-side: no endpoint, nothing sent to our servers. Apple devices get one "Apple Calendar" pill
 * (a downloaded `.ics`, which iOS/macOS open natively); everything else gets "Google Calendar". Until
 * the device is known both pills render.
 */
export function AddToCalendar({ info }: { info: CalendarInfo }) {
  const pageUrl = eventPageUrl(info.slug);
  const googleHref = googleCalendarUrl(info, pageUrl);
  const platform = useSyncExternalStore<Platform>(noSubscribe, detectPlatform, () => "unknown");

  function handleDownloadIcs() {
    const ics = buildIcs(info, pageUrl, new Date());
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${info.slug}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  const pillClass =
    "inline-flex items-center justify-center rounded-full border border-(--ev-accent-ink)/40 px-4 py-1.5 text-xs font-medium tracking-[0.2em] text-(--ev-accent-ink) uppercase transition-colors hover:bg-(--ev-accent-ink)/10";

  return (
    <div className="mt-2 flex flex-col items-center gap-2 @min-[640px]/ev:flex-row @min-[640px]/ev:gap-3">
      {platform !== "apple" && (
        <a href={googleHref} target="_blank" rel="noopener noreferrer" className={pillClass}>
          Google Calendar
        </a>
      )}
      {platform !== "other" && (
        <button type="button" onClick={handleDownloadIcs} className={pillClass}>
          Apple Calendar
        </button>
      )}
    </div>
  );
}

/** Mirrors the canonical-URL construction in `[slug]/page.tsx`. */
function eventPageUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";
  return new URL(`/${slug}`, base).toString();
}
