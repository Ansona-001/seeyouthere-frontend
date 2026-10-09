// TypeScript mirrors of the Go API's JSON shapes. Keep in sync with `internal/content`
// and `internal/httpapi` on the backend — see the build-out plan §3 (content model) and
// §4.1 (response shapes) in seeyouthere-backend.
//
// Re-exported from `api.ts` so callers only need one import.

// ---------------------------------------------------------------------------
// Content blocks (§3.1). `content` on an Event/PublicEvent is an ordered array
// of these. Every block carries `id` (client-generated, unique within the
// event) and `type` (a discriminant for the union below).
// ---------------------------------------------------------------------------

export type BlockType =
  | "hero"
  | "text"
  | "datetime"
  | "location"
  | "schedule"
  | "image"
  | "gallery"
  | "dress_code"
  | "links"
  | "faq"
  | "countdown"
  | "rsvp"
  | "guest_photos"
  | "people"
  | "video"
  | "wishes";

export type HeroBlock = {
  id: string;
  type: "hero";
  /** Small accent-font label above the title; <=60 runes, single line. */
  kicker: string;
  title: string;
  subtitle: string;
  /** Optional large monogram or numeral (0-4 chars: letters, digits, & · + -); omitted by the API when empty. */
  badge?: string;
  image: { media_id: string; alt: string } | null;
};

export type TextBlock = {
  id: string;
  type: "text";
  kicker: string;
  heading: string;
  body: string;
};

export type DatetimeBlock = {
  id: string;
  type: "datetime";
  kicker: string;
  heading: string;
  /** Wall-clock local time, `YYYY-MM-DDTHH:MM`. */
  start_local: string;
  /** Wall-clock local time or `""`. */
  end_local: string;
  /** IANA zone name, e.g. `"Europe/London"`. */
  timezone: string;
  all_day: boolean;
};

export type LocationBlock = {
  id: string;
  type: "location";
  kicker: string;
  heading: string;
  name: string;
  address: string;
  /** Validated https URL from the map host allowlist, or `""`. */
  map_url: string;
  notes: string;
};

export type ScheduleItem = {
  /** `"HH:MM"` or `""`. */
  time: string;
  title: string;
  description: string;
};

export type ScheduleBlock = {
  id: string;
  type: "schedule";
  kicker: string;
  heading: string;
  items: ScheduleItem[];
};

export type ImageBlock = {
  id: string;
  type: "image";
  media_id: string;
  alt: string;
  caption: string;
};

export type GalleryImage = { media_id: string; alt: string };

export type GalleryDisplay = "grid" | "carousel";

export type GalleryBlock = {
  id: string;
  type: "gallery";
  kicker: string;
  heading: string;
  images: GalleryImage[];
  /** `""` normalises to `"grid"` server-side; the API always sends the canonical value. */
  display: GalleryDisplay;
};

export type DressCodeBlock = {
  id: string;
  type: "dress_code";
  kicker: string;
  heading: string;
  body: string;
};

export type LinkItem = { label: string; url: string };

export type LinksBlock = {
  id: string;
  type: "links";
  kicker: string;
  heading: string;
  body: string;
  items: LinkItem[];
};

export type FaqItem = { question: string; answer: string };

export type FaqBlock = {
  id: string;
  type: "faq";
  kicker: string;
  heading: string;
  items: FaqItem[];
};

/** Requires a `datetime` block elsewhere in the same event. */
export type CountdownBlock = {
  id: string;
  type: "countdown";
  kicker: string;
  heading: string;
};

export type FieldType = "text" | "textarea" | "select" | "multiselect" | "boolean" | "number";

/** A field definition (§3.2) — occasion `rsvp_fields` and host `questions`. */
export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  max_length: number;
  options: string[];
  min: number | null;
  max: number | null;
  help: string;
};

/** Which occasion-provided fields are turned on for this event's RSVP block. */
export type RsvpFieldToggle = { key: string; required: boolean };

export type RsvpBlock = {
  id: string;
  type: "rsvp";
  kicker: string;
  heading: string;
  body: string;
  /** Wall-clock local time in the event's `datetime` zone, or `""`. */
  deadline_local: string;
  /** Heads cap, or null for no capacity limit. */
  capacity: number | null;
  /** Cap on party size for open (non-invite) RSVPs. */
  max_party_size: number;
  fields: RsvpFieldToggle[];
  questions: FieldDef[];
};

export type GuestPhotosBlock = {
  id: string;
  type: "guest_photos";
  kicker: string;
  heading: string;
  body: string;
  open: boolean;
};

/**
 * `photo` mirrors the media-ref shape used elsewhere; an empty `alt` renders
 * as the person's `name` on the frontend.
 */
export type Person = {
  name: string;
  role: string;
  photo: { media_id: string; alt: string } | null;
  family_label: string;
  family_names: string;
  place: string;
  bio: string;
};

/** <=2 per event, 1-6 people each (backend-enforced). */
export type PeopleBlock = {
  id: string;
  type: "people";
  kicker: string;
  heading: string;
  people: Person[];
};

export type VideoProvider = "youtube" | "vimeo";
export type VideoAspect = "16:9" | "4:3" | "1:1" | "9:16";

/**
 * Provider + id only — never a raw URL (build-out plan rich-blocks §1
 * decision 1). The embed `src` is rebuilt client-side from constants; see
 * `src/lib/video.ts`.
 */
export type VideoBlock = {
  id: string;
  type: "video";
  kicker: string;
  heading: string;
  provider: VideoProvider;
  video_id: string;
  /** Vimeo private-link hash, or `""`. Always `""` for `provider: "youtube"`. */
  vimeo_hash: string;
  aspect: VideoAspect;
  caption: string;
  /** Media id of a host-uploaded poster, or `""`. */
  poster_media_id: string;
};

export type Wish = { message: string; author: string };

/** <=1 per event, host-curated only — no public write endpoint exists for this block. */
export type WishesBlock = {
  id: string;
  type: "wishes";
  kicker: string;
  heading: string;
  items: Wish[];
};

export type Block =
  | HeroBlock
  | TextBlock
  | DatetimeBlock
  | LocationBlock
  | ScheduleBlock
  | ImageBlock
  | GalleryBlock
  | DressCodeBlock
  | LinksBlock
  | FaqBlock
  | CountdownBlock
  | RsvpBlock
  | GuestPhotosBlock
  | PeopleBlock
  | VideoBlock
  | WishesBlock;

// ---------------------------------------------------------------------------
// Template manifest / resolved theme (§3.4). The frontend never parses a raw
// manifest — the API always sends the already-resolved `Theme` shape.
// ---------------------------------------------------------------------------

/**
 * Font keys allowed in a template manifest. MUST match the Go allowlist in
 * `internal/content/manifest.go` (§3.4 of the build-out plan) — see
 * `src/lib/fonts.ts` for the loader that backs this union.
 */
export type FontKey =
  | "figtree"
  | "bricolage_grotesque"
  | "playfair_display"
  | "cormorant_garamond"
  | "dm_serif_display"
  | "lora"
  | "fraunces"
  | "great_vibes"
  | "birthstone"
  | "montserrat"
  | "bodoni_moda"
  | "pinyon_script"
  | "bagel_fat_one"
  | "limelight"
  | "josefin_sans";

export type Layout = "centered" | "split" | "stacked";
export type HeroStyle = "full_bleed" | "framed" | "text_only" | "spotlight" | "color_block";
export type Decoration = "none" | "line" | "floral" | "dots" | "heart";

/** Rich-blocks theme knobs (additive, manifest schema stays `1`). */
export type Surface = "plain" | "card" | "glass";
export type Texture = "none" | "grid" | "dots";
export type HeadingScale = "regular" | "display";

export type PaletteColors = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent_text: string;
};

/**
 * A palette as the template catalog lists it. `accent_ink`, `art` and `foil`
 * are schema-2 only and sit at palette level (not inside `colors`); the Go
 * side omits them when empty. The resolved `Theme` carries the chosen
 * palette's art/foil/ink at theme level instead.
 */
export type Palette = {
  id: string;
  name: string;
  colors: PaletteColors;
  accent_ink?: string;
  /** Art colour ramp (`art1`..`art8` tokens), `#RRGGBB`. */
  art?: string[];
  /** Foil gradient stops, 3-5 `#RRGGBB`. */
  foil?: string[];
};

/** `accent`: kicker font, `""` = falls back to `heading`. */
export type FontPair = { id: string; name: string; heading: FontKey; body: FontKey; accent: FontKey | "" };

/** `events.overrides` — ids must exist in the pinned manifest, or `""` for "use default". */
export type Overrides = { palette: string; font: string };

/**
 * Resolved theme sent to the frontend (§3.4 "Resolved theme"; rich-blocks
 * extension §4.2). The new fields are optional so a frontend build newer
 * than the deployed API still renders: `surface` falls back to `"plain"`,
 * `texture` to `"none"`, `heading_scale` to `"regular"`, `accent_ink` to
 * `palette.accent`, `fonts.accent` to `fonts.heading`.
 */
export type Theme = {
  layout: Layout;
  hero_style: HeroStyle;
  decoration: Decoration;
  surface?: Surface;
  texture?: Texture;
  heading_scale?: HeadingScale;
  /** Server-computed, already contrast-checked against background/surface (incl. glass blends). Use directly. */
  accent_ink?: string;
  palette: PaletteColors;
  fonts: { heading: FontKey; body: FontKey; accent?: FontKey };
  background: { src: string; opacity: number } | null;
  /** Theme engine v2 (schema-2 manifests); absent on v1 themes. */
  engine?: 2;
  layers?: ThemeLayer[];
  art?: string[];
  foil?: string[];
  ornament?: ThemeOrnament;
  card?: ThemeCard;
  motion?: Motion;
};

export type Motion = "none" | "draw_on" | "pop_and_settle" | "foil_sheen";

/**
 * Plain strings on purpose: the runtime treats every value as untrusted and
 * unknown values render nothing. Intended values:
 * - hero: none | wreath_monogram | sticker_numeral | foil_numeral | ring | cloud | doorway | monogram_rule
 * - divider: none | line | floral | dots | heart | olive_sprig | squiggle | deco_diamond | wave | sparkle_rule
 * - badge: none | starburst_sticker | wax_seal | foil_seal
 * - ampersand: none | script
 * - hero_ink: resolved HEX colour
 */
export type ThemeOrnament = {
  hero: string;
  divider: string;
  badge: string;
  ampersand: string;
  hero_ink: string;
};

/**
 * Plain strings on purpose (see `ThemeOrnament`). Intended values:
 * - style: soft | glass | reply_card | sticker | chamfered | none
 * - border: none | hairline | ink | foil | foil_inset
 * - fields: boxed | underline
 * - buttons: accent | foil
 */
export type ThemeCard = {
  style: string;
  border: string;
  radius: number;
  fields: string;
  buttons: string;
};

/** Resolved background layer; colours are HEX strings, opacities are numbers. */
export type ThemeLayer = { region?: "page" | "hero" } & (
  | {
      kind: "paper";
      tone: string;
      /** Omitted by the API when unset (as are the matching opacities). */
      glow?: string;
      glow_opacity?: number;
      vignette?: string;
      vignette_opacity?: number;
    }
  | { kind: "block"; edge: "straight" | "scallop" | "wave"; color: string }
  | {
      kind: "pattern";
      pattern: "grid" | "dots" | "halftone" | "sunburst" | "pinstripe" | "gingham" | "stripes";
      color: string;
      opacity: number;
      origin: string;
      mask: string;
    }
  | {
      kind: "texture";
      texture: "grain" | "fibers" | "linen" | "wood" | "watercolour" | "foil" | "marble" | "velvet";
      opacity: number;
      blend: string;
      colors?: string[];
    }
  | {
      kind: "art";
      art: string;
      placement: string;
      colors?: string[];
      paint?: "foil";
      opacity: number;
      density?: string;
    }
  | { kind: "frame"; frame: string; inset: number; color?: string; paint?: "foil" }
  | { kind: "image"; opacity: number; src: string }
);

// ---------------------------------------------------------------------------
// Media references embedded in Event / PublicEvent (§4.1)
// ---------------------------------------------------------------------------

/** `src` is a path like `/media/<event_id>/<media_id>`; widths are served at `${src}/${w}.jpg`. */
export type MediaRef = { src: string; width: number; height: number };
export type MediaMap = Record<string, MediaRef>;

// ---------------------------------------------------------------------------
// Catalog (§4.2)
// ---------------------------------------------------------------------------

export type CopyTemplate = {
  title_template: string;
  tagline: string;
  rsvp_heading: string;
  rsvp_body: string;
  share_message: string;
};

export type SetupQuestionType = "text" | "date_time" | "timezone" | "place";

export type SetupQuestionTarget =
  | "title_var"
  | "datetime.start_local"
  | "datetime.timezone"
  | "location.name"
  | "location.address"
  | "hero.subtitle";

export type SetupQuestion = {
  key: string;
  label: string;
  type: SetupQuestionType;
  required: boolean;
  max_length: number;
  target: SetupQuestionTarget;
};

export type Occasion = {
  slug: string;
  name: string;
  copy: CopyTemplate;
  setup_questions: SetupQuestion[];
  optional_blocks: BlockType[];
  rsvp_fields: FieldDef[];
};

export type OccasionsResponse = { occasions: Occasion[] };

export type TemplateSummary = {
  id: string;
  slug: string;
  name: string;
  /** Mirrors `templates.tags`; `occasions` lists the occasion slugs this template suits. */
  tags: { occasions?: string[] };
  version: number;
  defaults: { palette: string; font: string };
  palettes: Palette[];
  fonts: FontPair[];
  layout: Layout;
  hero_style: HeroStyle;
  decoration: Decoration;
};

export type TemplatesResponse = { templates: TemplateSummary[] };

// ---------------------------------------------------------------------------
// Events (host view) and summaries (§4.1, §4.3)
// ---------------------------------------------------------------------------

export type EventRole = "owner" | "editor" | "viewer" | "anon";
export type EventStatus = "draft" | "published" | "hidden" | "taken_down";
export type Visibility = "unlisted" | "password" | "invite_only" | "public";
export type RsvpMode = "open" | "invite_only";

export type EventTemplateRef = {
  id: string;
  slug: string;
  name: string;
  version: number;
  latest_version: number;
};

export type Event = {
  id: string;
  /** null until a slug is set. */
  slug: string | null;
  title: string;
  occasion_slug: string;
  status: EventStatus;
  visibility: Visibility;
  has_password: boolean;
  rsvp_mode: RsvpMode;
  remove_branding: boolean;
  notify_rsvps: boolean;
  starts_at: string | null;
  /** Derived from the `datetime` block's `end_local`; null when there is no end time. Never compute this client-side. */
  ends_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  role: EventRole;
  template: EventTemplateRef;
  content: Block[];
  overrides: Overrides;
  theme: Theme;
  media: MediaMap;
  /** null until a slug is set. */
  url: string | null;
};

export type EventRsvpTotals = { yes: number; no: number; maybe: number; yes_heads: number };

export type EventSummary = {
  id: string;
  slug: string | null;
  title: string;
  occasion_slug: string;
  status: EventStatus;
  starts_at: string | null;
  role: EventRole;
  created_at: string;
  rsvp: EventRsvpTotals;
};

export type EventsListResponse = { events: EventSummary[]; next_cursor: string | null };

/** GET /v1/slugs/{slug} (§4.3). */
export type SlugAvailability = {
  slug: string;
  available: boolean;
  reason: "invalid" | "taken" | "blocked" | null;
};

// ---------------------------------------------------------------------------
// Public event page (§4.4)
// ---------------------------------------------------------------------------

export type ClosedReason = "deadline" | "capacity" | null;

export type PublicRsvpConfig = {
  enabled: boolean;
  open: boolean;
  closed_reason: ClosedReason;
  /** null when the RSVP block has no capacity set. */
  spots_left: number | null;
  /** Effective field toggles resolved to full definitions. */
  fields: FieldDef[];
  max_party_size: number;
};

export type PublicEventData = {
  id: string;
  slug: string;
  title: string;
  occasion_slug: string;
  visibility: Visibility;
  rsvp_mode: RsvpMode;
  starts_at: string | null;
  /** Derived from the `datetime` block's `end_local`; null when there is no end time. Never compute this client-side. */
  ends_at: string | null;
  indexable: boolean;
  remove_branding: boolean;
  content: Block[];
  theme: Theme;
  media: MediaMap;
  rsvp: PublicRsvpConfig;
};

export type PhotoItem = { id: string; src: string; width: number; height: number };

export type PublicEvent = {
  event: PublicEventData;
  viewer: {
    guest: { name: string; household_size: number } | null;
    rsvp: Rsvp | null;
  };
  photos: { items: PhotoItem[]; next_cursor: string | null };
};

export type PublicPhotosResponse = { items: PhotoItem[]; next_cursor: string | null };

// ---------------------------------------------------------------------------
// RSVP (§4.1, §4.4, §4.5)
// ---------------------------------------------------------------------------

export type AttendingStatus = "yes" | "no" | "maybe";

export type RsvpAnswerValue = string | string[] | boolean | number;

export type Rsvp = {
  id: string;
  name: string;
  email: string | null;
  attending: AttendingStatus;
  count: number;
  answers: Record<string, RsvpAnswerValue>;
  guest_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RsvpsListResponse = { rsvps: Rsvp[]; next_cursor: string | null };

export type RsvpSummary = {
  yes: number;
  no: number;
  maybe: number;
  yes_heads: number;
  maybe_heads: number;
  total: number;
  guests_total: number;
  guests_responded: number;
  capacity: number | null;
};

// ---------------------------------------------------------------------------
// Guests (§4.1, §4.6)
// ---------------------------------------------------------------------------

export type Guest = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  household_size: number;
  invited_at: string | null;
  created_at: string;
  rsvp: { attending: AttendingStatus; count: number; updated_at: string } | null;
  /** Only populated for the owner/editor viewing their own guest list. */
  invite_url: string | null;
};

export type GuestsListResponse = { guests: Guest[]; next_cursor: string | null };

// ---------------------------------------------------------------------------
// Media (§4.1, §4.8)
// ---------------------------------------------------------------------------

export type ModerationStatus = "pending" | "approved" | "rejected";
export type UploadedBy = "host" | "guest";

export type Media = {
  id: string;
  src: string;
  width: number;
  height: number;
  size_bytes: number;
  uploaded_by: UploadedBy;
  moderation_status: ModerationStatus;
  guest_name: string | null;
  created_at: string;
};

export type MediaListResponse = { media: Media[]; next_cursor: string | null };

// ---------------------------------------------------------------------------
// Co-hosts (§4.7)
// ---------------------------------------------------------------------------

export type MemberRole = "owner" | "editor" | "viewer";

export type Member = { user_id: string; email: string; name: string; role: MemberRole };

export type MembersListResponse = { members: Member[] };

// ---------------------------------------------------------------------------
// Errors (§4)
// ---------------------------------------------------------------------------

export type ValidationIssue = { path: string; code: string; message: string };

export type ApiErrorDetails =
  | ValidationIssue[]
  | { current_version: number }
  | { spots_left: number | null }
  | { missing: string[] }
  | { row: number; field: string; code: string }[];

export type ApiErrorBody = {
  error: { code: string; message: string; details?: ApiErrorDetails };
};

// ---------------------------------------------------------------------------
// Account (§4.9)
// ---------------------------------------------------------------------------

export type MfaStatus = { enrolled: boolean; verified: boolean };

export type Session = {
  id: string;
  created_at: string;
  last_seen_at: string;
  user_agent: string;
  ip: string;
  current: boolean;
};

export type SessionsListResponse = { sessions: Session[] };

// ---------------------------------------------------------------------------
// Admin (§4.11)
// ---------------------------------------------------------------------------

export type AdminRole = "support" | "moderator" | "super_admin";
export type UserStatus = "active" | "suspended" | "banned";

export type AdminOverview = {
  open_reports: number;
  pending_photos: number;
  new_users_7d: number;
  events_published_7d: number;
};

export type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  roles: AdminRole[];
  created_at: string;
};

export type AdminUsersListResponse = { users: AdminUserSummary[]; next_cursor: string | null };

export type AdminAuditEntry = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  created_at: string;
};

export type AdminAuditListResponse = { entries: AdminAuditEntry[]; next_cursor: string | null };

export type AdminUserDetail = {
  user: AdminUserSummary;
  counts: { events: number; sessions: number };
  audit: AdminAuditEntry[];
};

export type ReportReason = "phishing" | "spam" | "harassment" | "illegal" | "other";
export type ReportStatus = "open" | "reviewing" | "dismissed" | "taken_down" | "restored";

export type AdminReport = {
  id: string;
  event: { id: string; slug: string | null; title: string; status: EventStatus; owner_email: string };
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  open_reports_for_event: number;
  created_at: string;
};

export type AdminReportsListResponse = { reports: AdminReport[]; next_cursor: string | null };

/** Report shape embedded in the admin event detail response — no event/owner join, since the caller already has the event. */
export type AdminEventReport = {
  id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
};

export type AdminEventSummary = EventSummary & { owner_email: string };
export type AdminEventsListResponse = { events: AdminEventSummary[]; next_cursor: string | null };

export type AdminEventDetail = {
  event: Event & { owner_email: string };
  counts: { rsvps: number; guests: number; media: number };
  reports: AdminEventReport[];
};

export type AdminMediaItem = Media & { event: { id: string; slug: string | null; title: string } };
export type AdminMediaListResponse = { media: AdminMediaItem[]; next_cursor: string | null };

export type TemplateStatus = "draft" | "published";

export type AdminTemplateVersion = {
  version: number;
  manifest: unknown;
  status: TemplateStatus;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type AdminTemplate = {
  id: string;
  slug: string;
  name: string;
  tags: { occasions?: string[] };
  is_premium: boolean;
  status: TemplateStatus;
  latest_version: number;
};

export type AdminTemplateDetail = AdminTemplate & { versions: AdminTemplateVersion[] };
export type AdminTemplatesListResponse = { templates: AdminTemplate[] };
export type AdminThemePreview = { palette_id: string; font_id: string; theme: Theme };
export type AdminTemplatePreviewResponse = { previews: AdminThemePreview[] };

export type SlugBlocklistEntry = { term: string; reason: string };
export type SlugBlocklistResponse = { terms: SlugBlocklistEntry[]; next_cursor: string | null };
