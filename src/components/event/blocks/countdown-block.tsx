import type { CountdownBlock as CountdownBlockType } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";
import { Countdown } from "../countdown";

/** Requires the event's derived `starts_at` instant (from its `datetime` block); renders nothing without it. */
export function CountdownBlock({ block, startsAt }: { block: CountdownBlockType; startsAt: string | null }) {
  if (!startsAt) return null;

  return (
    <section className="flex flex-col items-center gap-3 px-2 py-8 text-center">
      <BlockHeading kicker={block.kicker} heading={block.heading} />
      <Countdown target={startsAt} />
    </section>
  );
}
