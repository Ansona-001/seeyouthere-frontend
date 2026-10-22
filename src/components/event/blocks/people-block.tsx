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
  const hasPhoto = Boolean(block.photo);
  // Over a backdrop photo, a pair of hosts shares one frosted panel (groom | & | bride) so the picture shows
  // around it instead of being hidden behind two separate boxes.
  const pair = hasPhoto && block.people.length === 2;

  return (
    <section className={cn("px-2 py-8 @min-[640px]/ev:px-4", hasPhoto && "pt-[clamp(5rem,16vw,9rem)] pb-14")}>
      <BlockHeading
        kicker={block.kicker}
        heading={block.heading}
        className={cn(
          "mb-6 text-center",
          hasPhoto && "[text-shadow:0_0_16px_var(--ev-surface),0_0_5px_var(--ev-surface)]",
        )}
      />
      {pair ? (
        <EvCard
          as="div"
          className="ev-person ev-person-pair mx-auto grid max-w-3xl grid-cols-1 gap-0 rounded-3xl p-0! @min-[768px]/ev:grid-cols-[1fr_auto_1fr]"
        >
          <PersonBody person={block.people[0]} media={media} as="article" className="px-7 py-8" />
          <div
            aria-hidden="true"
            className="flex items-center justify-center gap-3 px-8 text-(--ev-accent-ink) @min-[768px]/ev:flex-col @min-[768px]/ev:px-0 @min-[768px]/ev:py-8"
          >
            <span className="h-px flex-1 bg-current opacity-25 @min-[768px]/ev:h-auto @min-[768px]/ev:w-px" />
            <span className="text-4xl leading-none [font-family:var(--ev-font-heading)]">&amp;</span>
            <span className="h-px flex-1 bg-current opacity-25 @min-[768px]/ev:h-auto @min-[768px]/ev:w-px" />
          </div>
          <PersonBody person={block.people[1]} media={media} as="article" className="px-7 py-8" />
        </EvCard>
      ) : (
        <div
          className={cn(
            "mx-auto grid gap-6",
            single ? "max-w-sm grid-cols-1" : "grid-cols-1 @min-[768px]/ev:grid-cols-2",
            block.people.length > 4 && "@min-[1024px]/ev:grid-cols-3",
          )}
        >
          {block.people.map((person, index) => (
            <EvCard
              key={index}
              as="article"
              className="ev-person rounded-3xl p-6 in-data-[ev-hero=invitation]:px-7 in-data-[ev-hero=invitation]:py-8"
            >
              <PersonBody person={person} media={media} />
            </EvCard>
          ))}
        </div>
      )}
    </section>
  );
}

/** One person's portrait, name, role and family lines, without any box around it. */
function PersonBody({
  person,
  media,
  as: Component = "div",
  className,
}: {
  person: Person;
  media: MediaMap;
  as?: "div" | "article";
  className?: string;
}) {
  const photo = person.photo ? media[person.photo.media_id] : undefined;
  const alt = person.photo?.alt || person.name;

  return (
    <Component className={cn("flex flex-col items-center gap-3 text-center in-data-[ev-hero=invitation]:gap-4", className)}>
      {photo && (
        <div className="ev-portrait size-36 overflow-hidden rounded-full ring-2 ring-(--ev-accent)/40 @min-[640px]/ev:size-44">
          <Image src={photo.src} alt={alt} width={480} height={480} className="size-full object-cover" />
        </div>
      )}

      <div>
        <p className="text-lg font-medium break-words [font-family:var(--ev-font-heading)] in-data-[ev-hero=invitation]:text-[clamp(2rem,7vw,2.6rem)] in-data-[ev-hero=invitation]:leading-tight in-data-[ev-hero=invitation]:font-normal">
          {person.name}
        </p>
        {person.role && (
          <p className="mt-0.5 text-xs tracking-[0.2em] text-(--ev-muted) uppercase in-data-[ev-hero=invitation]:mt-1.5 in-data-[ev-hero=invitation]:inline-flex in-data-[ev-hero=invitation]:items-center in-data-[ev-hero=invitation]:gap-3 in-data-[ev-hero=invitation]:text-(--ev-accent-ink) in-data-[ev-hero=invitation]:before:h-px in-data-[ev-hero=invitation]:before:w-7 in-data-[ev-hero=invitation]:before:bg-current in-data-[ev-hero=invitation]:before:opacity-45 in-data-[ev-hero=invitation]:before:content-[''] in-data-[ev-hero=invitation]:after:h-px in-data-[ev-hero=invitation]:after:w-7 in-data-[ev-hero=invitation]:after:bg-current in-data-[ev-hero=invitation]:after:opacity-45 in-data-[ev-hero=invitation]:after:content-['']">
            {person.role}
          </p>
        )}
      </div>

      {(person.family_label || person.family_names) && (
        <p className="text-sm text-(--ev-muted) in-data-[ev-hero=invitation]:flex in-data-[ev-hero=invitation]:flex-col in-data-[ev-hero=invitation]:gap-0.5 in-data-[ev-hero=invitation]:text-[0.95rem]">
          {person.family_label && <span className="in-data-[ev-hero=invitation]:text-xs in-data-[ev-hero=invitation]:tracking-[0.12em] in-data-[ev-hero=invitation]:uppercase">{person.family_label} </span>}
          {person.family_names && <span className="text-(--ev-text) in-data-[ev-hero=invitation]:leading-snug">{person.family_names}</span>}
        </p>
      )}

      {person.place && (
        <p className="text-sm text-(--ev-muted) in-data-[ev-hero=invitation]:border-t in-data-[ev-hero=invitation]:border-(--ev-accent-ink)/20 in-data-[ev-hero=invitation]:pt-3 in-data-[ev-hero=invitation]:italic">
          {person.place}
        </p>
      )}

      {person.bio && <p className="text-sm whitespace-pre-line text-(--ev-text)">{person.bio}</p>}
    </Component>
  );
}
