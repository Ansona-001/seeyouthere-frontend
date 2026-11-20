"use client";

import { CircleHelp, House, LogOut, Plus, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const ITEM =
  "group flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[0.6875rem] font-semibold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:flex-none md:gap-1 md:py-2";
const ICON_BOX =
  "grid size-9 place-items-center rounded-xl transition-colors group-hover:bg-muted group-data-[active]:bg-primary/10 group-data-[active]:text-brand-heading md:size-10";

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  className,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "" : undefined}
      className={cn(ITEM, active && "text-brand-heading", className)}
    >
      <span className={ICON_BOX}>
        <Icon className="size-5" aria-hidden />
      </span>
      {label}
    </Link>
  );
}

/**
 * The signed-in app's navigation: a slim icon rail down the left from md up, a bar along the bottom on phones.
 * Home is the dashboard (its invites/events filter lives on the page itself); Create is the primary action. Help and
 * Account live outside `/app` but share this shell (see `AppShell`).
 */
export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onDashboard = pathname === "/app";

  async function logout() {
    setPending(true);
    try {
      await api("/v1/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <nav
      aria-label="Main"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-1 border-t bg-card px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))]",
        "md:static md:z-auto md:w-[5.25rem] md:shrink-0 md:flex-col md:items-center md:gap-1 md:border-t-0 md:bg-transparent md:px-2 md:py-4",
      )}
    >
      <Link
        href="/"
        aria-label="See You There, home"
        className="mb-2 hidden rounded-md text-brand-heading outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:block"
      >
        <Logo variant="mark" title="" className="size-8" />
      </Link>

      <Link
        href="/create"
        className="group flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[0.6875rem] font-semibold text-brand-heading outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:mb-2 md:flex-none md:gap-1"
      >
        <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105 md:size-11 motion-reduce:transition-none">
          <Plus className="size-5" aria-hidden />
        </span>
        Create
      </Link>

      <NavItem href="/app" label="Home" icon={House} active={onDashboard} />

      <div className="hidden flex-1 md:block" />

      <NavItem href="/help" label="Help" icon={CircleHelp} active={pathname.startsWith("/help")} className="hidden md:flex" />
      <NavItem href="/account" label="Account" icon={UserRound} active={pathname.startsWith("/account")} />
      <button type="button" onClick={logout} disabled={pending} className={cn(ITEM, "disabled:opacity-60")}>
        <span className={ICON_BOX}>
          <LogOut className="size-5" aria-hidden />
        </span>
        {pending ? "…" : "Log out"}
      </button>
    </nav>
  );
}
