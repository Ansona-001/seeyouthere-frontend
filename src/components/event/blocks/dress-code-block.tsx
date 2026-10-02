import type { DressCodeBlock as DressCodeBlockType } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";

export function DressCodeBlock({ block }: { block: DressCodeBlockType }) {
  return (
    <section className="px-2 py-8 text-center">
      <BlockHeading kicker={block.kicker} heading={block.heading || "Dress code"} className="mb-3" />
      <p className="mx-auto max-w-prose whitespace-pre-line text-(--ev-muted)">{block.body}</p>
    </section>
  );
}
