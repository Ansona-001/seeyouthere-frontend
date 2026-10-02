import type { LinksBlock as LinksBlockType } from "@/lib/api-types";
import { isSafeHttpsUrl } from "@/lib/urls";

import { BlockHeading } from "../block-heading";

export function LinksBlock({ block }: { block: LinksBlockType }) {
  const items = block.items.filter((item) => isSafeHttpsUrl(item.url));
  if (items.length === 0 && !block.body) return null;

  return (
    <section className="flex flex-col items-center gap-3 px-2 py-8 text-center">
      <BlockHeading kicker={block.kicker} heading={block.heading} />
      {block.body && <p className="max-w-prose whitespace-pre-line text-(--ev-muted)">{block.body}</p>}
      {items.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
              className="rounded-full bg-(--ev-accent) px-4 py-2 text-sm font-medium text-(--ev-accent-text) transition-opacity hover:opacity-90"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
