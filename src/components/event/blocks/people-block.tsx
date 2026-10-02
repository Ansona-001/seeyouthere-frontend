import Image from "next/image";

import type { MediaMap, PeopleBlock as PeopleBlockType, Person } from "@/lib/api-types";
import { cn } from "@/lib/utils";

import { BlockHeading } from "../block-heading";
import { EvCard } from "../surface";

/**
 * Generalises the reference design's "Meet the Couple" two-card layout to
 * any count of 1-6 people (build-out plan rich-blocks §6.2). One column
 * below `md`; two from `md`; three from `lg` only past four people, so two
 * people (the common case) stay a clean two-up pair at every width above
 * mobile.
 */
export function PeopleBlock({ block, media }: { block: PeopleBlockType; media: MediaMap }) {
  const single = block.people.length === 1;

  return (
    <section className="px-2 py-8 sm:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-6 text-center" />
      <div
        className={cn(
          "mx-auto grid gap-6",
          single ? "max-w-sm grid-cols-1" : "grid-cols-1 md:grid-cols-2",
          block.people.length > 4 && "lg:grid-cols-3",
        )}
      >
        {block.people.map((person, index) => (
          <PersonCard key={index} person={person} media={media} />
        ))}
      </div>
    </section>
  );
}

function PersonCard({ person, media }: { person: Person; media: MediaMap }) {
  const photo = person.photo ? media[person.photo.media_id] : undefined;
  const alt = person.photo?.alt || person.name;

  return (
    <EvCard as="article" className="flex flex-col items-center gap-3 rounded-3xl p-6 text-center">
      <div className="size-36 overflow-hidden rounded-full ring-2 ring-(--ev-accent)/40 sm:size-44">
        {photo ? (
          <Image src={photo.src} alt={alt} width={480} height={480} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-(--ev-accent)/10 text-(--ev-accent)" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-16 fill-current opacity-40">
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.3h19.6v-2.3c0-3.3-6.5-4.9-9.8-4.9z" />
            </svg>
          </div>
        )}
      </div>

      <div>
        <p className="text-lg font-medium break-words [font-family:var(--ev-font-heading)]">{person.name}</p>
        {person.role && (
          <p className="mt-0.5 text-xs tracking-[0.2em] text-(--ev-muted) uppercase">{person.role}</p>
        )}
      </div>

      {(person.family_label || person.family_names) && (
        <p className="text-sm text-(--ev-muted)">
          {person.family_label && <span>{person.family_label} </span>}
          {person.family_names && <span className="text-(--ev-text)">{person.family_names}</span>}
        </p>
      )}

      {person.place && <p className="text-sm text-(--ev-muted)">{person.place}</p>}

      {person.bio && <p className="text-sm whitespace-pre-line text-(--ev-text)">{person.bio}</p>}
    </EvCard>
  );
}
