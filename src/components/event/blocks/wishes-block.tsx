import type { WishesBlock as WishesBlockType } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";
import { Carousel } from "../carousel";
import { EvCard } from "../surface";

/**
 * Host-curated well-wishes (build-out plan rich-blocks extension §3.1,
 * §6.2): a `"fade"` carousel of quoted messages. `<=1` per event,
 * `1-30` items (backend-enforced) — no public write endpoint exists for
 * this block, so every message here came through the host's own PATCH.
 */
export function WishesBlock({ block, interactive }: { block: WishesBlockType; interactive: boolean }) {
  if (block.items.length === 0) return null;

  return (
    <section className="px-2 py-8 sm:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-6 text-center" />
      <div className="mx-auto max-w-xl">
        <Carousel
          label={block.heading || "Wishes"}
          variant="fade"
          autoplayMs={6500}
          interactive={interactive}
        >
          {block.items.map((wish, index) => (
            <figure key={index} className="px-1">
              <EvCard className="flex flex-col items-center gap-4 px-6 py-8 text-center">
                <span
                  aria-hidden="true"
                  className="text-5xl leading-none text-(--ev-accent)/40 [font-family:var(--ev-font-heading)]"
                >
                  &ldquo;
                </span>
                <blockquote className="whitespace-pre-line text-lg leading-relaxed">{wish.message}</blockquote>
                <figcaption className="text-sm text-(--ev-muted) [font-variant-caps:all-small-caps] tracking-widest">
                  {wish.author}
                </figcaption>
              </EvCard>
            </figure>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
