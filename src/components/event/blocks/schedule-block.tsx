import { MapPinIcon } from "lucide-react";

import type { ScheduleBlock as ScheduleBlockType } from "@/lib/api-types";
import { cn } from "@/lib/utils";

import { BlockHeading } from "../block-heading";
import { EvCard } from "../surface";

/**
 * Build-out plan rich-blocks extension §4.3: under `surface: "card"`/
 * `"glass"` the schedule becomes a `grid gap-4 @min-[768px]/ev:grid-cols-2` of item
 * cards; under `"plain"` (the default, every existing template) it renders
 * identically to the original bulleted timeline. One markup, driven by the
 * `data-ev-surface` ancestor attribute — no JS, no duplicate DOM.
 *
 * Schema-2 themes (`timeline`) keep that card layout for one or two items, where it reads well, and switch
 * to a single timeline card from three items up, where separate cards would just be a tall stack.
 */
export function ScheduleBlock({
  block,
  timeline = false,
  bloom = false,
}: {
  block: ScheduleBlockType;
  timeline?: boolean;
  /** Paint the themed watercolour bloom behind the timeline card. */
  bloom?: boolean;
}) {
  if (timeline && block.items.length > 2) return <TimelineSchedule block={block} bloom={bloom} />;
  return (
    <section className="px-2 py-8 @min-[640px]/ev:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-6 text-center" />
      <ol
        className={cn(
          "mx-auto grid max-w-3xl grid-cols-1 gap-4 @min-[768px]/ev:grid-cols-2",
          "in-data-[ev-surface=plain]:max-w-md in-data-[ev-surface=plain]:grid-cols-1 in-data-[ev-surface=plain]:gap-5 in-data-[ev-surface=plain]:border-l in-data-[ev-surface=plain]:border-(--ev-accent)/25 in-data-[ev-surface=plain]:pl-5",
          "@min-[768px]/ev:in-data-[ev-surface=plain]:grid-cols-1",
        )}
      >
        {block.items.map((item, index) => (
          <li key={index} className="relative">
            <span
              aria-hidden="true"
              className="hidden in-data-[ev-surface=plain]:absolute in-data-[ev-surface=plain]:top-1.5 in-data-[ev-surface=plain]:-left-[1.4rem] in-data-[ev-surface=plain]:block in-data-[ev-surface=plain]:size-2 in-data-[ev-surface=plain]:rounded-full in-data-[ev-surface=plain]:bg-(--ev-accent)"
            />
            <EvCard className="flex h-full flex-col items-center justify-center gap-1 text-center in-data-[ev-surface=plain]:items-stretch in-data-[ev-surface=plain]:justify-start in-data-[ev-surface=plain]:text-left">
              {item.time && <p className="text-sm font-medium text-(--ev-accent)">{item.time}</p>}
              <p className="font-medium">{item.title}</p>
              {item.location && <ItemLocation location={item.location} />}
              {item.description && (
                <p className="text-sm whitespace-pre-line text-(--ev-muted)">{item.description}</p>
              )}
            </EvCard>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ItemLocation({ location, className }: { location: string; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-1 text-sm text-(--ev-muted) in-data-[ev-surface=plain]:justify-start", className)}>
      <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0" />
      <span>{location}</span>
    </p>
  );
}

/** "13:30" -> "1:30 PM", matching how the date block shows times. Anything that is not HH:MM is shown as typed. */
function clockLabel(time: string): string {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!m) return time;
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, 0, 1, Number(m[1]), Number(m[2]))),
  );
}

/** A constant same-origin watercolour (`public/themes`), drawn with `multiply` so its white paper drops out. */
function Bloom({ className }: { className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- decorative constant asset, sized by CSS
    <img
      src="/themes/mimosa-bloom.webp"
      alt=""
      width={720}
      height={662}
      loading="lazy"
      decoding="async"
      aria-hidden="true"
      className={cn("pointer-events-none absolute h-auto mix-blend-multiply select-none", className)}
    />
  );
}

/**
 * Schema-2 themes, three or more items: the whole day as one card. Each row is a time pill on the left, an
 * accent dot on a fading vertical line, and the title with its details on the right. Rows without a time keep
 * the line and dot with the time column empty, so every title lines up. With `bloom`, a soft watercolour
 * flower sits in two corners of the card.
 */
function TimelineSchedule({ block, bloom }: { block: ScheduleBlockType; bloom: boolean }) {
  return (
    <section className="px-2 py-8 @min-[640px]/ev:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-6 text-center" />
      <EvCard className="relative mx-auto w-full max-w-xl overflow-hidden px-5! py-8! @min-[640px]/ev:px-8!">
        {bloom && (
          <>
            <Bloom className="-top-10 -right-[4.5rem] w-44 rotate-12 opacity-80 @min-[640px]/ev:-right-20 @min-[640px]/ev:w-56" />
            <Bloom className="-bottom-14 -left-14 w-32 -scale-x-100 -rotate-[24deg] opacity-40 @min-[640px]/ev:-left-16 @min-[640px]/ev:w-44" />
          </>
        )}
        <ol className="relative">
          {block.items.map((item, index) => (
            <li key={index} className="group grid grid-cols-[5.25rem_1fr] gap-x-3 @min-[640px]/ev:grid-cols-[6rem_1fr] @min-[640px]/ev:gap-x-4">
              <div className="flex justify-end pt-0.5">
                {item.time && (
                  <span className="h-fit rounded-full bg-(--ev-accent)/10 px-2.5 py-1 text-[13px] leading-none font-semibold tracking-wide whitespace-nowrap text-(--ev-accent-ink) tabular-nums ring-1 ring-(--ev-accent)/15">
                    {clockLabel(item.time)}
                  </span>
                )}
              </div>
              <div className="relative pb-9 pl-6 group-last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute top-3 bottom-0 left-0 w-px bg-linear-to-b from-(--ev-accent)/45 via-(--ev-accent)/25 to-(--ev-accent)/45 group-last:hidden"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-[7px] -left-[5px] size-[11px] rounded-full bg-(--ev-label-ink,var(--ev-accent)) ring-[5px] ring-(--ev-surface)"
                />
                <p className="text-[17px] leading-snug font-semibold">{item.title}</p>
                {item.location && <ItemLocation location={item.location} className="mt-1" />}
                {item.description && (
                  <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-(--ev-muted)">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </EvCard>
    </section>
  );
}
