import type { TextBlock as TextBlockType } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";

export function TextBlock({ block }: { block: TextBlockType }) {
  return (
    <section className="px-2 py-8 text-center sm:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-3" />
      <p className="mx-auto max-w-prose text-balance whitespace-pre-line text-(--ev-muted)">{block.body}</p>
    </section>
  );
}
