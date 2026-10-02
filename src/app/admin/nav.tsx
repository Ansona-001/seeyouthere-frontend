"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/slugs", label: "Slug blocklist" },
  { href: "/admin/audit", label: "Audit log" },
] as const;

export function AdminNav({ roles }: { roles: string[] }) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/admin" className="font-heading text-lg font-semibold">
          Admin
        </Link>
        <nav aria-label="Admin sections" className="flex flex-wrap gap-1">
          {LINKS.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <span className="text-xs text-muted-foreground">{roles.join(", ")}</span>
      </div>
    </header>
  );
}
