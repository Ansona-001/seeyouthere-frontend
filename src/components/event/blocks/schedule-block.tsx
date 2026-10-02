import type { ScheduleBlock as ScheduleBlockType } from "@/lib/api-types";
import { cn } from "@/lib/utils";

import { BlockHeading } from "../block-heading";
import { EvCard } from "../surface";

/**
 * Build-out plan rich-blocks extension §4.3: under `surface: "card"`/
 * `"glass"` the schedule becomes a `grid gap-4 md:grid-cols-2` of item
 * cards; under `"plain"` (the default, every existing template) it renders
 * identically to the original bulleted timeline. One markup, driven by the
 * `data-ev-surface` ancestor attribute — no JS, no duplicate DOM.
 */
export function ScheduleBlock({ block }: { block: ScheduleBlockType }) {
  return (
    <section className="px-2 py-8 sm:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-6 text-center" />
      <ol
        className={cn(
          "mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2",
          "in-data-[ev-surface=plain]:max-w-md in-data-[ev-surface=plain]:grid-cols-1 in-data-[ev-surface=plain]:gap-5 in-data-[ev-surface=plain]:border-l in-data-[ev-surface=plain]:border-(--ev-accent)/25 in-data-[ev-surface=plain]:pl-5",
          "md:in-data-[ev-surface=plain]:grid-cols-1",
        )}
      >
        {block.items.map((item, index) => (
          <li key={index} className="relative">
            <span
              aria-hidden="true"
              className="hidden in-data-[ev-surface=plain]:absolute in-data-[ev-surface=plain]:top-1.5 in-data-[ev-surface=plain]:-left-[1.4rem] in-data-[ev-surface=plain]:block in-data-[ev-surface=plain]:size-2 in-data-[ev-surface=plain]:rounded-full in-data-[ev-surface=plain]:bg-(--ev-accent)"
            />
            <EvCard className="flex h-full flex-col gap-1">
              {item.time && <p className="text-sm font-medium text-(--ev-accent)">{item.time}</p>}
              <p className="font-medium">{item.title}</p>
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
