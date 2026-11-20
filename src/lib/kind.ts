import type { EventKind } from "./api-types";

/** What a dashboard item is called in UI copy: "invite" for invitations, "event" for hosted event sites. */
export function kindNoun(kind: EventKind): "invite" | "event" {
  return kind === "hosted" ? "event" : "invite";
}
