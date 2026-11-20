import type { ReactNode } from "react";

import { AppNav } from "./app-nav";

/**
 * The signed-in app's frame: a navigation rail (a bottom bar on phones) and one scrolling panel. `/app/*` uses it
 * through its layout; `/account` and `/help` (which live at their own URLs) wrap themselves in it for signed-in users.
 * Callers have already checked the session; this only draws the frame.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row md:overflow-hidden">
      <AppNav />
      <main className="min-w-0 flex-1 bg-card pb-24 md:m-2 md:ml-0 md:overflow-y-auto md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden md:rounded-3xl md:pb-0 md:ring-1 md:ring-foreground/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
