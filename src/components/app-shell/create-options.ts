/** One thing a user can start: an invite for an occasion, or an event website. */
export type CreateOption = {
  /** Occasion slug (picks the tile's colours and art). */
  slug: string;
  label: string;
  href: string;
  /** Draw the website tile instead of the invitation card art. */
  site?: boolean;
};

/** Invitation occasions, the same set the landing page and /create offer (each opens /create/[slug]). */
export const INVITE_OPTIONS: readonly CreateOption[] = [
  { slug: "wedding", label: "Wedding", href: "/create/wedding" },
  { slug: "birthday", label: "Birthday", href: "/create/birthday" },
  { slug: "baby-shower", label: "Baby shower", href: "/create/baby-shower" },
  { slug: "housewarming", label: "Housewarming", href: "/create/housewarming" },
  { slug: "engagement", label: "Engagement", href: "/create/engagement" },
  { slug: "party", label: "Party", href: "/create/party" },
  { slug: "function", label: "On stage", href: "/create/function" },
];

/** Hosting is its own product: an event website, created at /create/event. */
export const HOST_OPTION: CreateOption = { slug: "function", label: "Host an event", href: "/create/event", site: true };
