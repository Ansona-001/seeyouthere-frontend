import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { HOST_OPTION, INVITE_OPTIONS, type CreateOption } from "@/components/app-shell/create-options";
import { OccasionTile } from "@/components/app-shell/occasion-art";
import { EmptyState } from "@/components/brand/empty-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { EventKind, EventsListResponse, EventSummary } from "@/lib/api-types";
import { STATUS_LABEL } from "@/lib/event-status";
import { formatDateTime } from "@/lib/format";
import { serverApi } from "@/lib/server-api";
import { cn } from "@/lib/utils";

import { EventThumb, ThumbFrame } from "./event-thumb";
import { EventsList } from "./events-list";
import { ItemActions } from "./item-actions";
import { ScrollRow } from "./scroll-row";

export const metadata: Metadata = { title: "Your invites and events" };

type Tab = {
  /** `?tab=` (full list) and `?filter=` (home view) value. */
  key: "all" | "invites" | "events";
  /** Which kind the list is limited to; null = both. */
  kind: EventKind | null;
  label: string;
  createHref: string;
  createLabel: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction: string;
};

const TABS: readonly Tab[] = [
  {
    key: "all",
    kind: null,
    label: "All",
    createHref: "/create",
    createLabel: "Create an invite",
    emptyTitle: "Nothing here yet",
    emptyBody: "Pick an occasion above to design an invite, or host an event with its own website.",
    emptyAction: "Create your first invite",
  },
  {
    key: "invites",
    kind: "invite",
    label: "Invites",
    createHref: "/create",
    createLabel: "Create an invite",
    emptyTitle: "No invites yet",
    emptyBody: "Birthday, housewarming, wedding? Create a free invite and start collecting RSVPs in minutes.",
    emptyAction: "Create your first invite",
  },
  {
    key: "events",
    kind: "hosted",
    label: "Events",
    createHref: "/create/event",
    createLabel: "Host an event",
    emptyTitle: "No events yet",
    emptyBody: "Host a conference, concert or gala: a full event website with registration and door check-in.",
    emptyAction: "Host your first event",
  },
];

// One-tap starts for the home view: the invitation occasions (the stage one is on the Create popup), plus hosting.
const QUICK_START: readonly CreateOption[] = [...INVITE_OPTIONS.filter((o) => o.slug !== "function"), HOST_OPTION];

const kindQuery = (kind: EventKind | null) => (kind ? `&kind=${kind}` : "");

// Dashboard (build-out plan §4.3, §11.1). With no `?tab=` it is the home view: a start-something banner and the
// latest items, filtered by `?filter=all|invites|events`. `?tab=all|invites|events` is the full keyset-paginated
// list (newest first, owned and co-hosted). Both survive a refresh and only the open list is fetched.
export default async function DashboardPage({ searchParams }: PageProps<"/app">) {
  const { tab: rawTab, filter: rawFilter } = await searchParams;
  const tab = TABS.find((t) => t.key === rawTab);
  if (tab) return <ListView tab={tab} />;
  return <HomeView filter={TABS.find((t) => t.key === rawFilter) ?? TABS[0]} />;
}

async function HomeView({ filter }: { filter: Tab }) {
  const result = await serverApi<EventsListResponse>(`/v1/events?limit=8${kindQuery(filter.kind)}`);

  return (
    <>
      <h1 className="sr-only">Your dashboard</h1>

      <section
        aria-labelledby="start-title"
        className="rounded-3xl bg-linear-to-br from-brand-sage via-brand-linen to-brand-brass-bright/40 px-5 py-8 text-center sm:px-8 sm:py-10"
      >
        <h2 id="start-title" className="font-heading text-3xl text-brand-heading sm:text-5xl">
          What will you create today?
        </h2>
        <ScrollRow className="mt-7 [&>li:first-child]:ml-auto [&>li:last-child]:mr-auto">
          {QUICK_START.map((q) => (
            <li key={q.slug} className="shrink-0">
              <Link
                href={q.href}
                className="group flex min-w-[5.25rem] flex-col items-center gap-2 rounded-2xl px-2 py-1 text-sm font-medium whitespace-nowrap text-brand-heading outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <OccasionTile
                  slug={q.slug}
                  site={q.site}
                  className="size-16 rounded-full shadow-sm ring-1 ring-foreground/10 transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
                <span className="leading-tight">{q.label}</span>
              </Link>
            </li>
          ))}
        </ScrollRow>
      </section>

      <section aria-labelledby="recent-title" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="recent-title" className="font-heading text-2xl text-brand-heading sm:text-3xl">
            Continue designing
          </h2>
          <Link
            href={`/app?tab=${filter.key}`}
            className="text-sm font-semibold underline-offset-4 hover:underline"
          >
            See all
          </Link>
        </div>

        <nav aria-label="Filter designs" className="flex gap-2">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={t.key === "all" ? "/app" : `/app?filter=${t.key}`}
              aria-current={t.key === filter.key ? "page" : undefined}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full px-4 text-sm font-semibold ring-1 transition-colors",
                t.key === filter.key
                  ? "bg-primary text-primary-foreground ring-primary"
                  : "text-brand-heading ring-foreground/15 hover:bg-muted",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {!result.ok ? (
          <Alert variant="destructive">
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : result.data.events.length === 0 ? (
          <EmptyState
            title={filter.emptyTitle}
            action={
              <Button render={<Link href={filter.createHref} />} nativeButton={false}>
                {filter.emptyAction}
              </Button>
            }
          >
            {filter.emptyBody}
          </EmptyState>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
            {result.data.events.map((e) => (
              <li key={e.id}>
                <RecentCard event={e} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function RecentCard({ event: e }: { event: EventSummary }) {
  return (
    <div className="group relative">
    <Link
      href={`/app/${e.id}`}
      className="flex flex-col gap-2 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {/* The real page, streamed in per card so a slow event never holds up the dashboard. */}
      <Suspense
        fallback={
          <ThumbFrame>
            <OccasionTile slug={e.occasion_slug} site={e.kind === "hosted"} className="size-full" />
          </ThumbFrame>
        }
      >
        <EventThumb summary={e} />
      </Suspense>
      <span className="truncate font-semibold text-brand-heading">{e.title || "(untitled)"}</span>
      <span className="-mt-1.5 truncate text-sm text-muted-foreground">
        {e.kind === "hosted" ? "Event" : "Invite"} · {STATUS_LABEL[e.status]}
        {e.starts_at ? ` · ${formatDateTime(e.starts_at)}` : ""}
      </span>
    </Link>
    {/* Always visible on touch; on hover devices they appear with the pointer or keyboard focus. */}
    <ItemActions
      id={e.id}
      title={e.title}
      kind={e.kind}
      role={e.role}
      className="absolute top-2 right-2 transition-opacity focus-within:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
    />
    </div>
  );
}

async function ListView({ tab }: { tab: Tab }) {
  const result = await serverApi<EventsListResponse>(`/v1/events?limit=25${kindQuery(tab.kind)}`);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-brand-heading">Your dashboard</h1>
        <Button render={<Link href={tab.createHref} />} nativeButton={false}>
          {tab.createLabel}
        </Button>
      </header>

      <nav
        aria-label="Dashboard sections"
        className="-mx-4 flex gap-1 overflow-x-auto border-b px-4 pb-px md:-mx-8 md:px-8"
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/app?tab=${t.key}`}
            aria-current={t.key === tab.key ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-t-lg px-4 text-base font-semibold transition-colors",
              t.key === tab.key
                ? "border-b-2 border-primary text-brand-heading"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : result.data.events.length === 0 ? (
        <EmptyState
          title={tab.emptyTitle}
          action={
            <Button render={<Link href={tab.createHref} />} nativeButton={false}>
              {tab.emptyAction}
            </Button>
          }
        >
          {tab.emptyBody}
        </EmptyState>
      ) : (
        // Keyed by tab so switching tabs never carries one list's "load more" state into the other.
        <EventsList
          key={tab.key}
          kind={tab.kind ?? undefined}
          initialEvents={result.data.events}
          initialCursor={result.data.next_cursor}
        />
      )}
    </>
  );
}
