import type { EventStatus } from "./api-types";

/** How an event's status reads in dashboard lists and cards. */
export const STATUS_LABEL: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  hidden: "Unpublished",
  taken_down: "Taken down",
};
