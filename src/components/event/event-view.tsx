import type { ReactNode } from "react";

import type {
  Block,
  ClosedReason,
  FieldDef,
  HeroBlock as HeroBlockType,
  LocationBlock as LocationBlockType,
  MediaMap,
  PhotoItem,
  Rsvp,
  Theme,
} from "@/lib/api-types";
import type { CalendarInfo } from "@/lib/calendar";
import { cn } from "@/lib/utils";

import { CountdownBlock } from "./blocks/countdown-block";
import { DatetimeBlock } from "./blocks/datetime-block";
import { DressCodeBlock } from "./blocks/dress-code-block";
import { FaqBlock } from "./blocks/faq-block";
import { GalleryBlock } from "./blocks/gallery-block";
import { GuestPhotosBlock } from "./blocks/guest-photos-block";
import { HeroBlock } from "./blocks/hero-block";
import { ImageBlock } from "./blocks/image-block";
import { LinksBlock } from "./blocks/links-block";
import { LocationBlock } from "./blocks/location-block";
import { PeopleBlock } from "./blocks/people-block";
import { RsvpBlock } from "./blocks/rsvp-block";
import { ScheduleBlock } from "./blocks/schedule-block";
import { TextBlock } from "./blocks/text-block";
import { VideoBlock } from "./blocks/video-block";
import { WishesBlock } from "./blocks/wishes-block";
import { DecorationDivider } from "./decorations";
import { EventFooter } from "./footer";
import { EventLayoutShell } from "./layouts";
import { ScrollReveal } from "./scroll-reveal";
import { EventTheme } from "./theme";
import { HeroV2 } from "./theme-engine/hero";
import { ART } from "./theme-engine/art/registry";
import { artClearance } from "./theme-engine/ornament-keys";
import { LayerStack } from "./theme-engine/layers";
import { LayoutV2 } from "./theme-engine/layout";
import { BadgeOrnament, DividerOrnament } from "./theme-engine/ornaments";
import { ThemeRootV2 } from "./theme-engine/root";

export type EventViewMode = "live" | "preview";

export type EventViewRsvpProps = {
  /** Effective occasion fields, already resolved by the API. */
  effectiveFields: FieldDef[];
  maxPartySize: number;
  spotsLeft: number | null;
  closedReason: ClosedReason;
  guestName?: string;
  existingRsvp?: Rsvp | null;
  onSuccess?: (rsvp: Rsvp) => void;
};

export type EventViewProps = {
  content: Block[];
  theme: Theme;
  media: MediaMap;
  /** `"live"` on the public page and editor "preview" pane; `"preview"` disables every interactive leaf. */
  mode: EventViewMode;
  removeBranding?: boolean;
  /** Needed for the RSVP/report/photo-upload endpoints and the footer link; omit for a chrome-less preview. */
  slug?: string;
  /** The event's derived `starts_at` instant — required for the `countdown` block, never computed here. */
  startsAt?: string | null;
  /** The event's derived `ends_at` instant, for the `datetime` block's "add to calendar" — never computed here. */
  endsAt?: string | null;
  /** The event title, used as the calendar `SUMMARY`/event name. Omit to disable "add to calendar". */
  title?: string;
  rsvp?: EventViewRsvpProps;
  photos?: PhotoItem[];
  /** Cursor for the guest-photos block's "load more" (§4.4); ignored when `photos` is omitted. */
  photosNextCursor?: string | null;
};

/**
 * Renders an event's `content` blocks against its resolved `theme` — the one
 * component shared by the public page (`[slug]/page.tsx`, RSC) and the
 * editor's live preview (client tree). Pure: no data fetching, no
 * server-only imports, so it works in either context (build-out plan §11.3).
 */
export function EventView({
  content,
  theme,
  media,
  mode,
  removeBranding = false,
  slug,
  startsAt = null,
  endsAt = null,
  title,
  rsvp,
  photos,
  photosNextCursor = null,
}: EventViewProps) {
  const heroBlock = content.find((block): block is HeroBlockType => block.type === "hero");
  const rest = content.filter((block) => block.type !== "hero");
  const locationBlock = content.find((block): block is LocationBlockType => block.type === "location");
  const calendarLocation = locationBlock ? [locationBlock.name, locationBlock.address].filter(Boolean).join(", ") : "";

  const blocks = (
    <ScrollReveal enabled={mode === "live"}>
      {rest.map((block, index) => (
        <BlockSection
          key={block.id}
          divider={
            theme.engine === 2 ? (
              <DividerOrnament divider={theme.ornament?.divider} />
            ) : (
              <DecorationDivider decoration={theme.decoration} />
            )
          }
          showDivider={index > 0 || Boolean(heroBlock)}
        >
          <RenderBlock
            block={block}
            media={media}
            mode={mode}
            slug={slug}
            startsAt={startsAt}
            endsAt={endsAt}
            title={title}
            calendarLocation={calendarLocation}
            rsvp={rsvp}
            photos={photos}
            photosNextCursor={photosNextCursor}
            badge={
              theme.engine === 2 ? <BadgeOrnament badge={theme.ornament?.badge} text={heroBlock?.badge} /> : undefined
            }
          />
        </BlockSection>
      ))}
    </ScrollReveal>
  );

  if (theme.engine === 2) {
    // Theme engine v2: container-query shell, layered background. The v2 hero
    // owns its hero-region layer stack.
    const hero = heroBlock ? <HeroV2 block={heroBlock} theme={theme} media={media} /> : null;
    // Keep the footer clear of art that hangs in the bottom corners.
    const clearBottom = artClearance(theme.layers, (key) => Object.hasOwn(ART, key)).bottom;
    return (
      <ThemeRootV2 theme={theme} className="flex min-h-dvh flex-col">
        <LayerStack layers={theme.layers} region="page" foil={theme.foil} />
        <div className="flex-1" style={!slug && clearBottom ? { paddingBottom: clearBottom } : undefined}>
          <LayoutV2 layout={theme.layout} hero={hero}>
            {blocks}
          </LayoutV2>
        </div>
        {slug && <EventFooter slug={slug} removeBranding={removeBranding} mode={mode} clearBottom={clearBottom} />}
      </ThemeRootV2>
    );
  }

  return (
    <EventTheme theme={theme} mode={mode} className="flex min-h-dvh flex-col">
      <div className="flex-1">
        <EventLayoutShell
          layout={theme.layout}
          hero={
            heroBlock ? (
              <HeroBlock block={heroBlock} heroStyle={theme.hero_style} decoration={theme.decoration} media={media} />
            ) : null
          }
        >
          {blocks}
        </EventLayoutShell>
      </div>
      {slug && <EventFooter slug={slug} removeBranding={removeBranding} mode={mode} />}
    </EventTheme>
  );
}

/**
 * `data-ev-reveal` is the hook `ScrollReveal` (scroll-reveal.tsx) uses to
 * find sections to animate. The transition classes here are this
 * component's own responsibility (rich-blocks extension §6.6): `ScrollReveal`
 * only toggles `data-reveal`/`data-revealed` attributes on this element; the
 * visual fade + rise-in lives in these `motion-safe:` classes, so it's a
 * no-op (fully visible, no layout shift) without JS, under
 * `prefers-reduced-motion`, and before the container opts in via
 * `data-reveal="on"`.
 */
function BlockSection({
  children,
  divider,
  showDivider,
}: {
  children: ReactNode;
  divider: ReactNode;
  showDivider: boolean;
}) {
  return (
    <div
      data-ev-reveal=""
      className={cn(
        "motion-safe:transition-[opacity,translate] motion-safe:duration-700 motion-safe:ease-[cubic-bezier(.43,.13,.23,.96)]",
        "motion-safe:in-data-[reveal=on]:not-data-revealed:translate-y-8 motion-safe:in-data-[reveal=on]:not-data-revealed:opacity-0",
      )}
    >
      {showDivider && divider}
      {children}
    </div>
  );
}

function RenderBlock({
  block,
  media,
  mode,
  slug,
  startsAt,
  endsAt,
  title,
  calendarLocation,
  rsvp,
  photos,
  photosNextCursor,
  badge,
}: {
  block: Block;
  media: MediaMap;
  mode: EventViewMode;
  slug?: string;
  startsAt: string | null;
  endsAt: string | null;
  title?: string;
  calendarLocation: string;
  rsvp?: EventViewRsvpProps;
  photos?: PhotoItem[];
  photosNextCursor?: string | null;
  /** Schema-2 badge ornament, laid over the RSVP section. */
  badge?: ReactNode;
}) {
  switch (block.type) {
    case "hero":
      // Rendered separately by EventView via the layout shell.
      return null;
    case "text":
      return <TextBlock block={block} />;
    case "datetime": {
      // "Add to calendar" (rich-blocks §6.5): only on the live public page, with an
      // event `starts_at` instant and a `slug` to build the .ics UID/filename and
      // Google Calendar `details` link. No start time -> no buttons at all.
      const calendar: CalendarInfo | undefined =
        mode === "live" && slug && startsAt
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
      return <DatetimeBlock block={block} calendar={calendar} />;
    }
    case "location":
      return <LocationBlock block={block} interactive={mode === "live"} />;
    case "schedule":
      return <ScheduleBlock block={block} />;
    case "image":
      return <ImageBlock block={block} media={media} />;
    case "gallery":
      return <GalleryBlock block={block} media={media} mode={mode} />;
    case "dress_code":
      return <DressCodeBlock block={block} />;
    case "links":
      return <LinksBlock block={block} />;
    case "faq":
      return <FaqBlock block={block} />;
    case "countdown":
      return <CountdownBlock block={block} startsAt={startsAt} />;
    case "rsvp":
      return (
        <RsvpBlock
          block={block}
          mode={mode}
          slug={slug}
          effectiveFields={rsvp?.effectiveFields ?? []}
          maxPartySize={rsvp?.maxPartySize ?? block.max_party_size}
          spotsLeft={rsvp?.spotsLeft ?? null}
          closedReason={rsvp?.closedReason ?? null}
          guestName={rsvp?.guestName}
          existingRsvp={rsvp?.existingRsvp}
          onSuccess={rsvp?.onSuccess}
          badge={badge}
        />
      );
    case "guest_photos":
      return (
        <GuestPhotosBlock block={block} mode={mode} slug={slug} photos={photos} photosNextCursor={photosNextCursor} />
      );
    case "people":
      return <PeopleBlock block={block} media={media} />;
    case "video":
      return <VideoBlock block={block} media={media} interactive={mode === "live"} />;
    case "wishes":
      return <WishesBlock block={block} interactive={mode === "live"} />;
    default:
      return null;
  }
}
