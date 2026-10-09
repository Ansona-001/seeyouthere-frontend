import Link from "next/link";

import { ReportDialog } from "./report-dialog";

export function EventFooter({
  slug,
  removeBranding,
  mode,
  clearBottom = 0,
}: {
  slug: string;
  removeBranding: boolean;
  mode: "live" | "preview";
  /** Extra bottom space (px) so corner art never sits under the links. */
  clearBottom?: number;
}) {
  return (
    <footer
      className="flex flex-col items-center gap-2 border-t border-(--ev-accent)/10 px-6 py-8 text-center text-xs text-(--ev-muted)"
      style={clearBottom ? { paddingBottom: `max(2rem, ${clearBottom}px)` } : undefined}
    >
      {!removeBranding && (
        <Link href="/" className="hover:underline">
          Made with See You There
        </Link>
      )}
      {mode === "live" && <ReportDialog slug={slug} />}
    </footer>
  );
}
