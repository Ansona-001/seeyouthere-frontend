import type { Decoration } from "@/lib/api-types";
import { cn } from "@/lib/utils";

/**
 * Ornaments and dividers between blocks (build-out plan §6.3): trusted,
 * built-in SVG/CSS chosen by `theme.decoration` — never user-supplied markup.
 */
export function DecorationDivider({ decoration, className }: { decoration: Decoration; className?: string }) {
  if (decoration === "none") return null;

  return (
    <div className={cn("flex items-center justify-center py-5 text-(--ev-accent)", className)} aria-hidden="true">
      {decoration === "line" && (
        <svg width="128" height="16" viewBox="0 0 128 16" fill="none" className="opacity-70">
          <line x1="0" y1="8" x2="52" y2="8" stroke="currentColor" strokeWidth="1" />
          <path d="M64 2l6 6-6 6-6-6z" fill="currentColor" />
          <line x1="76" y1="8" x2="128" y2="8" stroke="currentColor" strokeWidth="1" />
        </svg>
      )}
      {decoration === "floral" && (
        <svg width="76" height="30" viewBox="0 0 76 30" fill="none" className="opacity-80">
          <path d="M38 28V6" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M38 6c-6 0-10 4-10 8M38 6c6 0 10 4 10 8M38 13c-5 0-8 3-8 7M38 13c5 0 8 3 8 7"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
          <circle cx="38" cy="4" r="2.5" fill="currentColor" />
        </svg>
      )}
      {decoration === "dots" && (
        <div className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-current" />
          <span className="size-2 rounded-full bg-current" />
          <span className="size-1.5 rounded-full bg-current" />
        </div>
      )}
      {decoration === "heart" && (
        <div className="relative flex w-4/5 max-w-44 items-center text-(--ev-accent-ink)">
          <span className="h-px w-full bg-gradient-to-r from-transparent via-current/60 to-transparent" />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="absolute left-1/2 -translate-x-1/2"
          >
            <path d="M12 21s-6.72-4.35-9.3-8.14C1.03 10.1 1.6 6.6 4.6 5.1c2.3-1.1 4.8-.5 6.4 1.2l1 1.05 1-1.05c1.6-1.7 4.1-2.3 6.4-1.2 3 1.5 3.57 5 1.9 7.76C18.72 16.65 12 21 12 21z" />
          </svg>
        </div>
      )}
    </div>
  );
}
