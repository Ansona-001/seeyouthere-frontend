import type { PublicWish, WishesBlock as WishesBlockType } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";
import { Carousel } from "../carousel";
import { EvCard } from "../surface";
import { WishSubmitForm } from "../wish-submit-form";

/**
 * Well-wishes: a `"fade"` carousel of quoted messages. Host-curated items
 * come first, then approved guest wishes (newest first). When `open`, live
 * visitors also get a submit form; submissions wait for host approval.
 */
export function WishesBlock({
  block,
  mode,
  slug,
  guestWishes = [],
}: {
  block: WishesBlockType;
  mode: "live" | "preview";
  slug?: string;
  guestWishes?: PublicWish[];
}) {
  const live = mode === "live";
  const showForm = live && Boolean(slug) && block.open;
  const wishes: { key: string; author: string; message: string }[] = [
    ...block.items.map((w, i) => ({ key: `h${i}`, ...w })),
    ...guestWishes.map((w) => ({ key: `g${w.id}`, author: w.author, message: w.message })),
  ];
  if (wishes.length === 0 && !(live && block.open)) return null;

  return (
    <section className="px-2 py-8 @min-[640px]/ev:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-6 text-center" />
      <div className="mx-auto flex max-w-xl flex-col gap-8">
        {wishes.length > 0 && (
          <Carousel label={block.heading || "Wishes"} variant="fade" autoplayMs={6500} interactive={live}>
            {wishes.map((wish) => (
              <figure key={wish.key} className="px-1">
                <EvCard className="flex flex-col items-center gap-4 overflow-hidden px-6 py-8 text-center">
                  <span
                    aria-hidden="true"
                    className="block h-5 text-5xl leading-none text-(--ev-accent)/40 [font-family:var(--ev-font-heading)]"
                  >
                    &ldquo;
                  </span>
                  <blockquote className="whitespace-pre-line break-words text-lg leading-relaxed">{wish.message}</blockquote>
                  <figcaption className="break-words text-sm text-(--ev-muted) [font-variant-caps:all-small-caps] tracking-widest">
                    {wish.author}
                  </figcaption>
                </EvCard>
              </figure>
            ))}
          </Carousel>
        )}
        {showForm && slug && <WishSubmitForm slug={slug} />}
      </div>
    </section>
  );
}
