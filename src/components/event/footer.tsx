import Link from "next/link";

import { ReportDialog } from "./report-dialog";

export function EventFooter({
  slug,
  removeBranding,
  mode,
}: {
  slug: string;
  removeBranding: boolean;
  mode: "live" | "preview";
}) {
  return (
    <footer className="flex flex-col items-center gap-2 border-t border-(--ev-accent)/10 px-6 py-8 text-center text-xs text-(--ev-muted)">
      {!removeBranding && (
        <Link href="/" className="hover:underline">
          Made with See You There
        </Link>
      )}
      {mode === "live" && <ReportDialog slug={slug} />}
    </footer>
  );
}
