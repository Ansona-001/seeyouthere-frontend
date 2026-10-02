import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";

import { EventView } from "@/components/event/event-view";
import { PasswordGate } from "@/components/event/password-gate";
import type { HeroBlock, PublicEvent } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { InviteRequired } from "./invite-required";

// The DB's slug regex already forbids characters that would need escaping
// here (build-out plan §3.5); this only folds case, matching the backend's
// `NormalizeSlug`.
function normalizeSlug(raw: string): string {
  return raw.toLowerCase();
}

// Deduplicated per request: `generateMetadata` and the page component both
// need it, and `serverApi` never throws, so both call sites get the same
// gate decision (build-out plan §11.2).
const getPublicEvent = cache((slug: string) => serverApi<PublicEvent>(`/v1/public/events/${encodeURIComponent(slug)}`));

function findHeroImageUrl(event: PublicEvent["event"]): string | undefined {
  const hero = event.content.find((block): block is HeroBlock => block.type === "hero");
  const media = hero?.image && event.media[hero.image.media_id];
  return media ? `${media.src}/1080.jpg` : undefined;
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const result = await getPublicEvent(normalizeSlug(rawSlug));

  // Gated and missing pages reveal nothing beyond the fact that *some* page
  // might exist here — no title, no image (build-out plan §4.4, §11.5).
  if (!result.ok) {
    return { title: "You're invited", robots: { index: false, follow: false } };
  }

  const { event } = result.data;
  const hero = event.content.find((block): block is HeroBlock => block.type === "hero");
  const description = hero?.subtitle || "You're invited — see the details and RSVP.";
  const imageUrl = findHeroImageUrl(event);

  return {
    title: event.title,
    description,
    robots: { index: event.indexable, follow: false },
    openGraph: {
      title: event.title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

export default async function PublicEventPage({ params }: PageProps<"/[slug]">) {
  const { slug: rawSlug } = await params;
  const slug = normalizeSlug(rawSlug);
  if (slug !== rawSlug) permanentRedirect(`/${slug}`);

  const result = await getPublicEvent(slug);

  if (!result.ok) {
    if (result.status === 401 && result.code === "password_required") {
      return <PasswordGate slug={slug} />;
    }
    if (result.status === 403 && result.code === "invite_required") {
      return <InviteRequired />;
    }
    if (result.status === 404) {
      notFound();
    }
    // Infra failure (API down) or an unmapped error — don't claim the page
    // doesn't exist; let the visitor retry instead.
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-24 text-center">
        <h1 className="text-2xl font-medium">Something went wrong</h1>
        <p className="text-muted-foreground">{result.message}</p>
      </main>
    );
  }

  const { event, viewer, photos } = result.data;

  return (
    <EventView
      content={event.content}
      theme={event.theme}
      media={event.media}
      mode="live"
      removeBranding={event.remove_branding}
      slug={slug}
      title={event.title}
      startsAt={event.starts_at}
      endsAt={event.ends_at}
      rsvp={{
        effectiveFields: event.rsvp.fields,
        maxPartySize: event.rsvp.max_party_size,
        spotsLeft: event.rsvp.spots_left,
        closedReason: event.rsvp.closed_reason,
        guestName: viewer.guest?.name,
        existingRsvp: viewer.rsvp,
      }}
      photos={photos.items}
      photosNextCursor={photos.next_cursor}
    />
  );
}
