"use client";

import type { CalendarInfo } from "@/lib/calendar";
import { buildIcs, googleCalendarUrl } from "@/lib/calendar";

/**
 * "Add to calendar" pair for the `datetime` block (build-out plan
 * rich-blocks extension §6.5). Fully client-side — no endpoint, nothing
 * sent to our servers.
 *
 * Both pills are always shown regardless of device: iPadOS reports its
 * platform as "Macintosh" (touch is the only tell, and that's true of some
 * touch-screen laptops too), so user-agent sniffing to hide one button is
 * unreliable. The Google Calendar link works everywhere, and iOS/macOS
 * open a downloaded `.ics` natively, so showing both is never wrong — at
 * worst a guest sees an extra button.
 */
export function AddToCalendar({ info }: { info: CalendarInfo }) {
  const pageUrl = eventPageUrl(info.slug);
  const googleHref = googleCalendarUrl(info, pageUrl);

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
    <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
      <a href={googleHref} target="_blank" rel="noopener noreferrer" className={pillClass}>
        Google Calendar
      </a>
      <button type="button" onClick={handleDownloadIcs} className={pillClass}>
        Apple / Outlook (.ics)
      </button>
    </div>
  );
}

/** Mirrors the canonical-URL construction in `[slug]/page.tsx`. */
function eventPageUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100";
  return new URL(`/${slug}`, base).toString();
}
