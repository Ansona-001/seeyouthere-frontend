import type { ReactNode } from "react";

import type { Layout } from "@/lib/api-types";

/**
 * Page-level arrangement for the three template layouts (build-out plan
 * §3.4). `hero` is pulled out of the block list by `EventView` so it can be
 * placed differently per layout (e.g. pinned beside the content on `split`).
 */
export function EventLayoutShell({ layout, hero, children }: { layout: Layout; hero: ReactNode | null; children: ReactNode }) {
  if (layout === "split") {
    return (
      <div className="lg:grid lg:grid-cols-2 lg:items-stretch">
        {hero && <div className="lg:sticky lg:top-0 lg:h-dvh">{hero}</div>}
        <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-6 sm:px-6 lg:py-10">{children}</div>
      </div>
    );
  }

  if (layout === "stacked") {
    return (
      <div className="flex flex-col">
        {hero}
        <div className="mx-auto flex w-full max-w-2xl flex-col px-4 sm:px-6">{children}</div>
      </div>
    );
  }

  // centered (default)
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 sm:px-6">
      {hero}
      {children}
    </div>
  );
}
