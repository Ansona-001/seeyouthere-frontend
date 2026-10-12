"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";
import type { EventRole } from "@/lib/api";

// Settings (publish/unpublish/delete/members live there too) is owner-only
// (build-out plan §4.7 "owner only"); editor and viewer never see the tab.
function tabsFor(role: EventRole, id: string) {
  const base = `/app/${id}`;
  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/rsvps`, label: "RSVPs" },
    { href: `${base}/guests`, label: "Guests" },
    { href: `${base}/photos`, label: "Photos" },
    { href: `${base}/team`, label: "Team" },
  ];
  if (role === "owner") tabs.push({ href: `${base}/settings`, label: "Settings" });
  return tabs;
}

export function EventNav({ eventId, title, role }: { eventId: string; title: string; role: EventRole }) {
  const pathname = usePathname();
  const tabs = tabsFor(role, eventId);
  const base = `/app/${eventId}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Link href="/app" className="inline-flex min-h-11 items-center rounded-md text-sm font-medium text-muted-foreground hover:text-foreground">
          Your events
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-heading text-2xl text-brand-heading">{title || "(untitled)"}</h1>
      </div>
      <nav aria-label="Event sections" className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 pb-px">
        {tabs.map((tab) => {
          const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-t-lg px-3.5 text-sm font-semibold transition-colors",
                active
                  ? "border-b-2 border-primary text-brand-heading"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
