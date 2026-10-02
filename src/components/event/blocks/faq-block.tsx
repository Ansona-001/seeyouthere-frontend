import type { FaqBlock as FaqBlockType } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";

export function FaqBlock({ block }: { block: FaqBlockType }) {
  return (
    <section className="px-2 py-8 sm:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-5 text-center" />
      <div className="mx-auto flex max-w-xl flex-col divide-y divide-(--ev-accent)/15">
        {block.items.map((item, index) => (
          <details key={index} className="group py-3">
            <summary className="cursor-pointer list-none font-medium marker:content-none focus-visible:outline-2 focus-visible:outline-(--ev-accent)">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span aria-hidden="true" className="shrink-0 text-(--ev-muted) transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-2 text-sm whitespace-pre-line text-(--ev-muted)">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
