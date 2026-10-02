import type { Block, FieldDef, MediaMap, Theme } from "@/lib/api-types";

// Sample data matching every block type in the build-out plan §3.1 and every
// palette/font/layout combination in §3.4, for exercising the shared event
// renderer in isolation (component-level QA, future tests) without a live
// API. Not used by any shipped page — real pages get this shape from the API.

export const fixtureMedia: MediaMap = {
  hero_photo: { src: "/_qa/hero", width: 1600, height: 2000 },
  gallery_photo_1: { src: "/_qa/gallery1", width: 900, height: 900 },
  gallery_photo_2: { src: "/_qa/gallery2", width: 900, height: 900 },
};

export const fixtureGuestPhotos = [{ id: "photo_1", src: "/_qa/photo1", width: 700, height: 700 }];

export const fixtureContent: Block[] = [
  {
    id: "hero1",
    type: "hero",
    kicker: "Together with their families",
    title: "Aiko & Ravi",
    subtitle: "are getting married",
    image: { media_id: "hero_photo", alt: "Aiko and Ravi laughing on a beach at sunset" },
  },
  {
    id: "dt1",
    type: "datetime",
    kicker: "",
    heading: "When",
    start_local: "2026-06-14T16:00",
    end_local: "2026-06-14T22:00",
    timezone: "America/Los_Angeles",
    all_day: false,
  },
  { id: "cd1", type: "countdown", kicker: "", heading: "Counting down" },
  {
    id: "loc1",
    type: "location",
    kicker: "",
    heading: "Where",
    name: "Meadowlark Gardens",
    address: "1010 Meadowlark Ln, Sonoma, CA",
    map_url: "",
    notes: "Parking is available on-site; a shuttle runs from the main gate every 15 minutes.",
  },
  {
    id: "txt1",
    type: "text",
    kicker: "",
    heading: "A little backstory",
    body: "We met on a rainy Tuesday at a bookshop that no longer exists, and six years later we're still arguing about which one of us picked the better book.",
  },
  {
    id: "people1",
    type: "people",
    kicker: "Meet the",
    heading: "Wedding party",
    people: [
      {
        name: "Aiko Tanaka",
        role: "The bride",
        photo: { media_id: "gallery_photo_1", alt: "Aiko smiling in a park" },
        family_label: "Daughter of",
        family_names: "Mr. Kenji & Mrs. Yumi Tanaka",
        place: "Portland, Oregon",
        bio: "Aiko grows tomatoes she will not shut up about and has read the same three novels every year since college.",
      },
      {
        name: "Ravi Menon",
        role: "The groom",
        photo: { media_id: "gallery_photo_2", alt: "Ravi laughing on a hiking trail" },
        family_label: "Son of",
        family_names: "Mr. Suresh & Mrs. Lakshmi Menon",
        place: "Seattle, Washington",
        bio: "Ravi will find a way to talk about his home espresso setup within five minutes of meeting you.",
      },
    ],
  },
  {
    id: "video1",
    type: "video",
    kicker: "Watch",
    heading: "How we met",
    provider: "youtube",
    video_id: "dQw4w9WgXcQ",
    vimeo_hash: "",
    aspect: "16:9",
    caption: "A three-minute cut of the proposal, shot by Ravi's brother.",
    poster_media_id: "gallery_photo_1",
  },
  {
    id: "sched1",
    type: "schedule",
    kicker: "",
    heading: "Schedule",
    items: [
      { time: "16:00", title: "Ceremony", description: "Please arrive 20 minutes early." },
      { time: "17:00", title: "Cocktail hour", description: "" },
      { time: "18:30", title: "Dinner & speeches", description: "" },
      { time: "21:00", title: "Dancing", description: "Until midnight." },
    ],
  },
  {
    id: "gal1",
    type: "gallery",
    kicker: "",
    heading: "A few favourites",
    display: "grid",
    images: [
      { media_id: "gallery_photo_1", alt: "Aiko and Ravi at the farmers market" },
      { media_id: "gallery_photo_2", alt: "Aiko and Ravi hiking" },
    ],
  },
  {
    id: "dress1",
    type: "dress_code",
    kicker: "",
    heading: "What to wear",
    body: "Garden formal. Think linen, not lace — and comfortable shoes; the ceremony lawn is grass.",
  },
  {
    id: "links1",
    type: "links",
    kicker: "",
    heading: "Good to know",
    body: "A couple of links before the big day.",
    items: [
      { label: "Hotel block", url: "https://example.com/hotel-block" },
      { label: "Registry", url: "https://example.com/registry" },
    ],
  },
  {
    id: "faq1",
    type: "faq",
    kicker: "",
    heading: "Questions",
    items: [
      { question: "Are kids welcome?", answer: "We love your little ones, but this one's grown-ups only." },
      { question: "Is there parking?", answer: "Yes — free on-site parking, and a shuttle from the main gate." },
    ],
  },
  {
    id: "wishes1",
    type: "wishes",
    kicker: "For the couple",
    heading: "Wishes",
    items: [
      { message: "Wishing you a lifetime of laughter and terrible puns.\nCan't wait to celebrate!", author: "Priya & Sam" },
      { message: "Two of the kindest people I know, finally making it official.", author: "Dev" },
      { message: "May your love keep growing like Aiko's tomato patch.", author: "Grandma Setsuko" },
    ],
  },
  {
    id: "photos1",
    type: "guest_photos",
    kicker: "",
    heading: "Share your photos",
    body: "Snap away and drop your favourites here — we'll feature the best ones.",
    open: true,
  },
  {
    id: "rsvp1",
    type: "rsvp",
    kicker: "",
    heading: "Will you be there?",
    body: "Let us know by May 1st.",
    deadline_local: "2026-05-01T00:00",
    capacity: 120,
    max_party_size: 4,
    fields: [
      { key: "dietary", required: false },
      { key: "message", required: false },
    ],
    questions: [
      { key: "q_song", label: "Song request", type: "text", required: false, max_length: 120, options: [], min: null, max: null, help: "" },
    ],
  },
];

export const fixtureEffectiveFields: FieldDef[] = [
  {
    key: "dietary",
    label: "Dietary requirements",
    type: "text",
    required: false,
    max_length: 200,
    options: [],
    min: null,
    max: null,
    help: "",
  },
  {
    key: "message",
    label: "Message for the couple",
    type: "textarea",
    required: false,
    max_length: 500,
    options: [],
    min: null,
    max: null,
    help: "",
  },
];

export const fixtureThemes: Record<"classic" | "modern" | "confetti" | "heirloom", Theme> = {
  classic: {
    layout: "centered",
    hero_style: "framed",
    decoration: "line",
    palette: {
      background: "#FBF8F3",
      surface: "#FFFFFF",
      text: "#1F1B16",
      muted: "#6B645C",
      accent: "#8C6A3F",
      accent_text: "#FFFFFF",
    },
    fonts: { heading: "playfair_display", body: "lora" },
    background: null,
  },
  modern: {
    layout: "split",
    hero_style: "full_bleed",
    decoration: "none",
    palette: {
      background: "#F4F1EC",
      surface: "#FFFFFF",
      text: "#141414",
      muted: "#5B5B5B",
      accent: "#B5502C",
      accent_text: "#FFFFFF",
    },
    fonts: { heading: "bricolage_grotesque", body: "figtree" },
    background: null,
  },
  confetti: {
    layout: "centered",
    hero_style: "text_only",
    decoration: "dots",
    palette: {
      background: "#FFF7E8",
      surface: "#FFFFFF",
      text: "#2B1D0E",
      muted: "#8A7860",
      accent: "#E0562A",
      accent_text: "#FFFFFF",
    },
    fonts: { heading: "fraunces", body: "figtree" },
    background: null,
  },
  // Rich-blocks reference template (build-out plan rich-blocks §4.5): glass
  // surface, grid texture, display headings, heart divider, a script
  // (birthstone) kicker font, and a server-computed `accent_ink`.
  heirloom: {
    layout: "centered",
    hero_style: "spotlight",
    decoration: "heart",
    surface: "glass",
    texture: "grid",
    heading_scale: "display",
    accent_ink: "#8A6E3C",
    palette: {
      background: "#F9F4EC",
      surface: "#FFFFFF",
      text: "#8B0000",
      muted: "#B22222",
      accent: "#8A6E3C",
      accent_text: "#FFFFFF",
    },
    fonts: { heading: "playfair_display", body: "montserrat", accent: "birthstone" },
    background: null,
  },
};

export const fixtureStartsAt = "2026-06-14T23:00:00Z"; // 16:00 America/Los_Angeles on 2026-06-14
