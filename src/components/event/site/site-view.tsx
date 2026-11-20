import type { ReactNode } from "react";
import Image from "next/image";

import type {
  Block,
  DatetimeBlock as DatetimeBlockType,
  HeroBlock as HeroBlockType,
  LocationBlock as LocationBlockType,
  MediaMap,
  PhotoItem,
  PublicWish,
  Theme,
} from "@/lib/api-types";
import type { CalendarInfo } from "@/lib/calendar";
import { cn } from "@/lib/utils";

import { formatLocal } from "../blocks/datetime-block";
import { Countdown } from "../countdown";
import type { EventViewMode, EventViewRsvpProps } from "../event-view";
import { EventFooter } from "../footer";
import { themeStyle } from "../theme";
import {
  DatetimeSection,
  FaqSection,
  LocationSection,
  PeopleSection,
  ScheduleSection,
  TextSection,
} from "./site-sections";

export type SiteViewProps = {
  content: Block[];
  theme: Theme;
  media: MediaMap;
  mode: EventViewMode;
  slug?: string;
  title?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  rsvp?: EventViewRsvpProps;
  photos?: PhotoItem[];
  photosNextCursor?: string | null;
  wishes?: PublicWish[];
  removeBranding?: boolean;
  /** Renders every block type the website layout has no markup of its own for. */
  renderFallback: (block: Block) => ReactNode;
};

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ev-accent)";
const NAV_LINK = cn(
  "inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-sm font-medium text-(--ev-muted) transition-colors hover:text-(--ev-text)",
  FOCUS,
);
const BTN = cn(
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full px-6 text-sm font-semibold transition-opacity hover:opacity-90",
  FOCUS,
);
const BTN_PRIMARY = cn(BTN, "bg-(--ev-accent) text-(--ev-accent-text)");

/** An anchor to a section; a plain span in the editor preview, where a hash link would scroll the whole editor page. */
function SiteLink({
  id,
  live,
  className,
  children,
}: {
  id: string;
  live: boolean;
  className: string;
  children: ReactNode;
}) {
  return live ? (
    <a href={`#s-${id}`} className={className}>
      {children}
    </a>
  ) : (
    <span className={className}>{children}</span>
  );
}

/**
 * Website layout for hosted events: sticky top bar, full-width hero, alternating full-width sections and a slim
 * footer. Styled only by the theme's palette and fonts. Responsive by `@container/ev` width, so the editor's
 * narrow pane shows the phone version.
 */
export function SiteView({
  content,
  theme,
  media,
  mode,
  slug,
  title,
  startsAt = null,
  endsAt = null,
  removeBranding = false,
  renderFallback,
}: SiteViewProps) {
  const live = mode === "live";
  const hero = content.find((b): b is HeroBlockType => b.type === "hero");
  const dateBlock = content.find((b): b is DatetimeBlockType => b.type === "datetime");
  const locationBlock = content.find((b): b is LocationBlockType => b.type === "location");
  const rsvpBlock = content.find((b) => b.type === "rsvp");
  const scheduleBlock = content.find((b) => b.type === "schedule");
  const calendarLocation = locationBlock ? [locationBlock.name, locationBlock.address].filter(Boolean).join(", ") : "";
  const heroCountdown = Boolean(startsAt) && content.some((b) => b.type === "countdown");
  const sections = content.filter((b) => b.type !== "hero" && !(heroCountdown && b.type === "countdown"));
  const siteTitle = title || hero?.title || "";

  const nav = sections
    .flatMap((b) => {
      const label = "heading" in b && typeof b.heading === "string" ? b.heading.trim() : "";
      return label && b.type !== "rsvp" ? [{ id: b.id, label }] : [];
    })
    .slice(0, 8);

  const image = hero?.image ? media[hero.image.media_id] : undefined;
  const dateText = dateBlock
    ? formatLocal(dateBlock.start_local, { month: "long", day: "numeric", year: "numeric" })
    : null;
  const timeText =
    dateBlock && !dateBlock.all_day ? formatLocal(dateBlock.start_local, { hour: "numeric", minute: "2-digit" }) : null;
  const meta = [[dateText, timeText].filter(Boolean).join(" · "), locationBlock?.name].filter(Boolean);

  return (
    <div
      style={themeStyle(theme)}
      className="@container/ev flex min-h-dvh flex-col bg-(--ev-bg) text-(--ev-text) [font-family:var(--ev-font-body)]"
    >
      <header className="sticky top-0 z-20 border-b border-(--ev-text)/10 bg-(--ev-bg)/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 @min-[640px]/ev:px-6">
          <p className="min-w-0 truncate py-3 text-lg font-semibold [font-family:var(--ev-font-heading)]">{siteTitle}</p>
          {nav.length > 0 && (
            <nav aria-label="Sections" className="mx-auto hidden items-center gap-1 @min-[900px]/ev:flex">
              {nav.map((item) => (
                <SiteLink key={item.id} id={item.id} live={live} className={NAV_LINK}>
                  {item.label}
                </SiteLink>
              ))}
            </nav>
          )}
          {rsvpBlock && (
            <SiteLink id={rsvpBlock.id} live={live} className={BTN_PRIMARY}>
              Register
            </SiteLink>
          )}
        </div>
        {nav.length > 0 && (
          <nav
            aria-label="Sections"
            className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-3 @min-[900px]/ev:hidden"
          >
            {nav.map((item) => (
              <SiteLink key={item.id} id={item.id} live={live} className={NAV_LINK}>
                {item.label}
              </SiteLink>
            ))}
          </nav>
        )}
      </header>

      {hero && (
        <div
          className={cn(
            "relative isolate overflow-hidden",
            image
              ? "text-white [--ev-accent-ink:white] [--ev-muted:rgb(255_255_255/0.85)]"
              : "bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--ev-accent)_14%,var(--ev-surface)),var(--ev-bg))]",
          )}
        >
          {image && (
            <>
              <Image
                src={image.src}
                alt={hero.image?.alt ?? ""}
                fill
                sizes="100vw"
                priority
                className="-z-10 object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/60" />
            </>
          )}
          <div className="mx-auto w-full max-w-5xl px-4 py-16 @min-[640px]/ev:px-6 @min-[640px]/ev:py-24 @min-[1024px]/ev:py-32">
            {hero.kicker && (
              <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-(--ev-accent-ink) uppercase">
                {hero.kicker}
              </p>
            )}
            <h1 className="max-w-4xl text-4xl leading-[1.05] font-semibold tracking-tight break-words text-balance [font-family:var(--ev-font-heading)] @min-[640px]/ev:text-6xl @min-[1024px]/ev:text-7xl">
              {hero.title}
            </h1>
            {hero.subtitle && (
              <p className="mt-5 max-w-2xl text-lg text-(--ev-muted) @min-[640px]/ev:text-xl">{hero.subtitle}</p>
            )}
            {meta.length > 0 && <p className="mt-6 text-base font-medium @min-[640px]/ev:text-lg">{meta.join(" — ")}</p>}
            {(rsvpBlock || scheduleBlock) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {rsvpBlock && (
                  <SiteLink id={rsvpBlock.id} live={live} className={BTN_PRIMARY}>
                    Register
                  </SiteLink>
                )}
                {scheduleBlock && (
                  <SiteLink id={scheduleBlock.id} live={live} className={cn(BTN, "border border-current")}>
                    See programme
                  </SiteLink>
                )}
              </div>
            )}
            {heroCountdown && startsAt && (
              <div className="mt-10">
                <Countdown target={startsAt} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1">
        {sections.map((block, index) => {
          let body: ReactNode;
          switch (block.type) {
            case "text":
              body = <TextSection block={block} />;
              break;
            case "datetime": {
              const calendar: CalendarInfo | undefined =
                live && slug && startsAt
                  ? {
                      title: title ?? "",
                      slug,
                      blockId: block.id,
                      startsAt,
                      endsAt,
                      allDay: block.all_day,
                      startLocal: block.start_local,
                      endLocal: block.end_local,
                      timezone: block.timezone,
                      location: calendarLocation,
                    }
                  : undefined;
              body = <DatetimeSection block={block} calendar={calendar} />;
              break;
            }
            case "location":
              body = <LocationSection block={block} interactive={live} />;
              break;
            case "schedule":
              body = <ScheduleSection block={block} />;
              break;
            case "faq":
              body = <FaqSection block={block} />;
              break;
            case "people":
              body = <PeopleSection block={block} media={media} />;
              break;
            default:
              body = <div className={cn(block.type === "rsvp" && "mx-auto max-w-2xl")}>{renderFallback(block)}</div>;
          }
          return (
            <section
              key={block.id}
              id={`s-${block.id}`}
              className={cn(
                "scroll-mt-28 py-12 @min-[640px]/ev:py-20",
                index % 2 === 0 ? "bg-(--ev-bg)" : "bg-(--ev-surface)",
              )}
            >
              <div className="mx-auto w-full max-w-5xl px-4 @min-[640px]/ev:px-6">{body}</div>
            </section>
          );
        })}
      </div>

      {slug ? (
        <>
          <div className="border-t border-(--ev-text)/10 px-4 pt-8 text-center text-sm font-medium text-(--ev-muted)">
            {siteTitle}
          </div>
          <EventFooter slug={slug} removeBranding={removeBranding} mode={mode} />
        </>
      ) : (
        <footer className="border-t border-(--ev-text)/10 px-4 py-8 text-center text-sm font-medium text-(--ev-muted)">
          {siteTitle}
        </footer>
      )}
    </div>
  );
}
