import type { ReactNode } from "react";

import type { Layout } from "@/lib/api-types";

/**
 * Page arrangement for a v2 theme. Same three layouts as `EventLayoutShell`
 * but switched by the width of the `@container/ev` root rather than the
 * viewport, so the editor's narrow preview pane lays out like a phone and a
 * wide pane like a desktop. `hero` is pinned beside the content on `split`.
 */
export function LayoutV2({ layout, hero, children }: { layout: Layout; hero: ReactNode | null; children: ReactNode }) {
  if (layout === "split") {
    return (
      <div className="@min-[900px]/ev:grid @min-[900px]/ev:grid-cols-2 @min-[900px]/ev:items-stretch">
        {hero && <div className="@min-[900px]/ev:sticky @min-[900px]/ev:top-0 @min-[900px]/ev:h-dvh">{hero}</div>}
        <div className="mx-auto flex w-full max-w-xl flex-col px-4 py-6 @min-[640px]/ev:px-6 @min-[900px]/ev:py-10">
          {children}
        </div>
      </div>
    );
  }

  if (layout === "stacked") {
    return (
      <div className="flex flex-col">
        {hero}
        <div className="mx-auto flex w-full max-w-2xl flex-col px-4 @min-[640px]/ev:px-6">{children}</div>
      </div>
    );
  }

  // centered (default)
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 @min-[640px]/ev:px-6">
      {hero}
      {children}
    </div>
  );
}
