import { EventView } from "@/components/event/event-view";
import type { Block, Event, EventSummary } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { OccasionTile } from "@/components/app-shell/occasion-art";

// What a card preview draws after the hero: static, text-led sections only. Anything interactive (RSVP form, links,
// wishes), media-heavy (gallery, video, photos) or live (guest photos) would be wasted work or nested interactive
// content inside the card's own link, and the first screen of an event is its hero and first sections anyway.
const PREVIEW_BLOCKS: ReadonlySet<Block["type"]> = new Set(["text", "datetime", "location", "schedule", "countdown", "dress_code", "faq"]);
const PREVIEW_SECTIONS = 2;

/**
 * A card thumbnail that is the real event: its own theme and content rendered by `EventView` in preview mode, at twice
 * the card's width and scaled to half so a phone-sized layout fits the tile. The event is fetched here (the list
 * endpoint carries no content), so callers wrap this in Suspense; if the fetch fails the occasion tile stands in.
 */
export async function EventThumb({ summary }: { summary: EventSummary }) {
  const result = await serverApi<{ event: Event }>(`/v1/events/${encodeURIComponent(summary.id)}`);
  if (!result.ok) return <ThumbFrame><OccasionTile slug={summary.occasion_slug} site={summary.kind === "hosted"} className="size-full" /></ThumbFrame>;

  const { event } = result.data;
  const hero = event.content.find((b) => b.type === "hero");
  const sections = event.content.filter((b) => PREVIEW_BLOCKS.has(b.type)).slice(0, PREVIEW_SECTIONS);
  const content = hero ? [hero, ...sections] : sections;

  return (
    <ThumbFrame>
      {/* inert + pointer-events-none: a picture of the page, not the page. */}
      <div inert className="pointer-events-none absolute top-0 left-0 w-[200%] origin-top-left scale-50 select-none">
        <EventView
          content={content}
          theme={event.theme}
          media={event.media}
          mode="preview"
          site={event.kind === "hosted"}
          title={event.title}
          startsAt={event.starts_at}
        />
      </div>
    </ThumbFrame>
  );
}

/** The thumbnail's frame; also what shows while the preview streams in. */
export function ThumbFrame({ children }: { children?: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted ring-1 ring-foreground/5 transition-shadow group-hover:shadow-md"
    >
      {children}
    </div>
  );
}
