import type { ClosedReason, FieldDef, RsvpBlock as RsvpBlockType, Rsvp } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";
import { RsvpForm } from "../rsvp-form";
import { EvCard } from "../surface";

export function RsvpBlock({
  block,
  mode,
  slug,
  effectiveFields,
  maxPartySize,
  spotsLeft,
  closedReason,
  guestName,
  existingRsvp,
  onSuccess,
}: {
  block: RsvpBlockType;
  mode: "live" | "preview";
  slug?: string;
  effectiveFields: FieldDef[];
  maxPartySize: number;
  spotsLeft: number | null;
  closedReason: ClosedReason;
  guestName?: string;
  existingRsvp?: Rsvp | null;
  onSuccess?: (rsvp: Rsvp) => void;
}) {
  return (
    <section id="rsvp" className="scroll-mt-20 px-2 py-10">
      <div className="mx-auto max-w-md text-center">
        <BlockHeading kicker={block.kicker} heading={block.heading} />
        {block.body && <p className="mt-2 whitespace-pre-line text-(--ev-muted)">{block.body}</p>}
      </div>
      <EvCard as="div" className="mx-auto mt-6 max-w-md">
        <RsvpForm
          mode={mode}
          slug={slug}
          fields={effectiveFields}
          questions={block.questions}
          maxPartySize={maxPartySize}
          spotsLeft={spotsLeft}
          closedReason={closedReason}
          guestName={guestName}
          existingRsvp={existingRsvp}
          onSuccess={onSuccess}
        />
      </EvCard>
    </section>
  );
}
