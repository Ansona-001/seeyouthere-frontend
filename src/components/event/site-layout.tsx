import type { ReactNode } from "react";

export type SiteNavItem = { id: string; label: string };

const NAV_LINK =
  "inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-medium text-(--ev-muted) transition-colors hover:text-(--ev-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ev-accent)";

const CTA_LINK =
  "inline-flex min-h-11 shrink-0 items-center rounded-full bg-(--ev-accent) px-5 text-sm font-semibold text-(--ev-accent-text) transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ev-accent)";

/** A section link; plain text in the editor preview, where an anchor would scroll the whole editor page. */
function NavLink({ item, interactive }: { item: SiteNavItem; interactive: boolean }) {
  return interactive ? (
    <a href={`#s-${item.id}`} className={NAV_LINK}>
      {item.label}
    </a>
  ) : (
    <span className={NAV_LINK}>{item.label}</span>
  );
}

/**
 * Website arrangement for hosted events: a sticky top bar (title, one link per titled section, a register button)
 * above the hero and the sections. Switched by `@container/ev` width like the other layouts, so the editor's
 * narrow pane shows the phone version (title and button on top, section links scrolling sideways below).
 */
export function SiteLayout({
  title,
  nav,
  ctaId,
  interactive,
  hero,
  children,
}: {
  title: string;
  nav: SiteNavItem[];
  /** Id of the section the register button jumps to; no button when absent. */
  ctaId?: string;
  interactive: boolean;
  hero: ReactNode | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-20 border-b border-(--ev-text)/10 bg-(--ev-bg)/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 @min-[640px]/ev:px-6">
          <p className="truncate py-3 text-lg font-semibold text-(--ev-text) [font-family:var(--ev-font-heading)]">
            {title}
          </p>
          {nav.length > 0 && (
            <nav aria-label="Sections" className="mx-auto hidden items-center gap-1 @min-[900px]/ev:flex">
              {nav.map((item) => (
                <NavLink key={item.id} item={item} interactive={interactive} />
              ))}
            </nav>
          )}
          {ctaId &&
            (interactive ? (
              <a href={`#s-${ctaId}`} className={CTA_LINK}>
                Register
              </a>
            ) : (
              <span className={CTA_LINK}>Register</span>
            ))}
        </div>
        {nav.length > 0 && (
          <nav
            aria-label="Sections"
            className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-3 @min-[900px]/ev:hidden"
          >
            {nav.map((item) => (
              <NavLink key={item.id} item={item} interactive={interactive} />
            ))}
          </nav>
        )}
      </header>
      {hero}
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 @min-[640px]/ev:px-6">{children}</div>
    </div>
  );
}
