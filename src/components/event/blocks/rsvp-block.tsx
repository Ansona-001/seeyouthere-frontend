import type { ReactNode } from "react";

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
  hosted,
  entryPasses,
  guestName,
  existingRsvp,
  onSuccess,
  badge,
}: {
  block: RsvpBlockType;
  mode: "live" | "preview";
  slug?: string;
  effectiveFields: FieldDef[];
  maxPartySize: number;
  spotsLeft: number | null;
  closedReason: ClosedReason;
  hosted?: boolean;
  entryPasses?: boolean;
  guestName?: string;
  existingRsvp?: Rsvp | null;
  onSuccess?: (rsvp: Rsvp) => void;
  /** Schema-2 badge ornament (sticker, seal) laid over the top corner of the reply card. */
  badge?: ReactNode;
}) {
  const card = (
    <EvCard as="div" className={badge ? undefined : "mx-auto mt-6 max-w-md"}>
      {closedReason === "invite_only" ? (
        <div role="status" className="rounded-lg bg-(--ev-surface) px-3 py-4 text-center text-(--ev-muted)">
          <p className="font-medium text-(--ev-text)">RSVP from your personal invite link.</p>
          <p className="mt-1 text-sm">Open the link we sent you, then reply here.</p>
        </div>
      ) : (
        <RsvpForm
          mode={mode}
          slug={slug}
          fields={effectiveFields}
          questions={block.questions}
          maxPartySize={maxPartySize}
          spotsLeft={spotsLeft}
          closedReason={closedReason}
          hosted={hosted}
          entryPasses={entryPasses}
          guestName={guestName}
          existingRsvp={existingRsvp}
          onSuccess={onSuccess}
        />
      )}
    </EvCard>
  );
  return (
    <section id="rsvp" className="scroll-mt-20 px-2 py-10">
      <div className="mx-auto max-w-md text-center">
        <BlockHeading kicker={block.kicker} heading={block.heading} />
        {block.body && <p className="mt-2 whitespace-pre-line text-(--ev-muted)">{block.body}</p>}
      </div>
      {badge ? (
        <div className="relative mx-auto mt-6 max-w-md">
          {badge}
          {card}
        </div>
      ) : (
        card
      )}
    </section>
  );
}
