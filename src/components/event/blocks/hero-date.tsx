import type { DatetimeBlock } from "@/lib/api-types";
import type { CalendarInfo } from "@/lib/calendar";

import { AddToCalendar } from "../add-to-calendar";
import { formatLocal } from "./datetime-block";

/**
 * The event's date and time, set under the names in the hero, with the "Add to Calendar" pill beneath
 * (live page only, where `calendar` is given). Renders nothing for a date it cannot read.
 */
export function HeroDate({ block, calendar }: { block: DatetimeBlock; calendar?: CalendarInfo }) {
  const date = formatLocal(block.start_local, { month: "long", day: "numeric", year: "numeric" });
  if (!date) return null;
  const time = block.all_day ? null : formatLocal(block.start_local, { hour: "numeric", minute: "2-digit" });
  return (
    <div className="ev-rise mt-6 flex flex-col items-center [--i:3]">
      <p className="text-lg tracking-wide text-(--ev-text)">
        {date}
        {time && <> &middot; {time}</>}
      </p>
      {calendar ? (
        <AddToCalendar info={calendar} />
      ) : (
        // The editor preview has no public link to add yet; show the pill so the layout is visible.
        <span
          aria-hidden="true"
          className="mt-2 inline-flex items-center justify-center rounded-full border border-(--ev-accent-ink)/40 px-4 py-1.5 text-xs font-medium tracking-[0.2em] text-(--ev-accent-ink) uppercase"
        >
          Add to Calendar
        </span>
      )}
    </div>
  );
}
