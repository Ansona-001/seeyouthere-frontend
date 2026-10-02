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
      <div className="flex items-center gap-2">
        <Link href="/app" className="text-sm text-muted-foreground hover:text-foreground">
          Your events
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-heading text-xl font-semibold">{title || "(untitled)"}</h1>
      </div>
      <nav aria-label="Event sections" className="flex flex-wrap gap-1 border-b pb-px">
        {tabs.map((tab) => {
          const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-t-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-b-2 border-primary text-foreground"
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
