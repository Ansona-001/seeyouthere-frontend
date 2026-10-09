import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/brand/site-footer";
import { getCurrentUser } from "@/lib/session";

import { LogoutButton } from "./logout-button";

// Auth gate for every `/app/*` dashboard route (build-out plan §11.1). The
// API is the real enforcement on every request the pages below make; this
// only saves a signed-out visitor the round trip and gives every dashboard
// page a consistent header.
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fapp");

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/app" aria-label="Your events" className="rounded-md text-brand-heading">
            <Logo title="" className="h-7" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <Link href="/account" className="rounded-md px-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
              Account
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">{children}</main>
      <SiteFooter />
    </div>
  );
}
