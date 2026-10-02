// Shared block metadata and factories for the editor (build-out plan §3.1,
// §11.4). Client-side limits here mirror the server's `internal/content`
// validators as a courtesy — the server is always the final authority, so a
// client/server mismatch only ever surfaces as a save error, never silent
// data loss.

import type { Block, BlockType, Person } from "@/lib/api-types";

export const BLOCK_TYPES: BlockType[] = [
  "hero",
  "text",
  "datetime",
  "location",
  "schedule",
  "image",
  "gallery",
  "dress_code",
  "links",
  "faq",
  "countdown",
  "rsvp",
  "guest_photos",
  "people",
  "video",
  "wishes",
];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero",
  text: "Text",
  datetime: "Date & time",
  location: "Location",
  schedule: "Schedule",
  image: "Image",
  gallery: "Gallery",
  dress_code: "Dress code",
  links: "Links",
  faq: "FAQ",
  countdown: "Countdown",
  rsvp: "RSVP",
  guest_photos: "Guest photos",
  people: "People",
  video: "Video",
  wishes: "Wishes",
};

/** Max instances of a block type per event (§3.1, rich-blocks extension §3.1); `Infinity` = unlimited. */
export const BLOCK_MAX: Record<BlockType, number> = {
  hero: 1,
  text: Infinity,
  datetime: 1,
  location: 3,
  schedule: 2,
  image: Infinity,
  gallery: 3,
  dress_code: 1,
  links: 2,
  faq: 1,
  countdown: 1,
  rsvp: 1,
  guest_photos: 1,
  people: 2,
  video: 3,
  wishes: 1,
};

export function newBlockId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export function countByType(content: Block[], type: BlockType): number {
  return content.filter((b) => b.type === type).length;
}

/** Whether one more block of `type` can be added given the current content. */
export function canAddBlock(content: Block[], type: BlockType): boolean {
  return countByType(content, type) < BLOCK_MAX[type];
}

export function createBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "hero":
      return { id, type, kicker: "", title: "Join us!", subtitle: "", image: null };
    case "text":
      return { id, type, kicker: "", heading: "", body: "" };
    case "datetime":
      return {
        id,
        type,
        kicker: "",
        heading: "When",
        start_local: "",
        end_local: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        all_day: false,
      };
    case "location":
      return { id, type, kicker: "", heading: "Where", name: "", address: "", map_url: "", notes: "" };
    case "schedule":
      return { id, type, kicker: "", heading: "Schedule", items: [{ time: "", title: "", description: "" }] };
    case "image":
      return { id, type, media_id: "", alt: "", caption: "" };
    case "gallery":
      return { id, type, kicker: "", heading: "Gallery", images: [], display: "grid" };
    case "dress_code":
      return { id, type, kicker: "", heading: "What to wear", body: "" };
    case "links":
      return { id, type, kicker: "", heading: "Good to know", body: "", items: [{ label: "", url: "" }] };
    case "faq":
      return { id, type, kicker: "", heading: "Questions", items: [{ question: "", answer: "" }] };
    case "countdown":
      return { id, type, kicker: "", heading: "Counting down" };
    case "rsvp":
      return {
        id,
        type,
        kicker: "",
        heading: "Will you be there?",
        body: "",
        deadline_local: "",
        capacity: null,
        max_party_size: 6,
        fields: [],
        questions: [],
      };
    case "guest_photos":
      return { id, type, kicker: "", heading: "Share your photos", body: "", open: true };
    case "people":
      return { id, type, kicker: "", heading: "Meet the hosts", people: [emptyPerson()] };
    case "video":
      return {
        id,
        type,
        kicker: "",
        heading: "",
        provider: "youtube",
        video_id: "",
        vimeo_hash: "",
        aspect: "16:9",
        caption: "",
        poster_media_id: "",
      };
    case "wishes":
      return { id, type, kicker: "", heading: "Wishes", items: [{ message: "", author: "" }] };
  }
}

/** A blank person row for the people editor form (§6.7). */
export function emptyPerson(): Person {
  return { name: "", role: "", photo: null, family_label: "", family_names: "", place: "", bio: "" };
}
