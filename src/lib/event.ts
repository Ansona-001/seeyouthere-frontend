import "server-only";

import { cache } from "react";

import type { Event } from "./api";
import { serverApi, type ServerApiResult } from "./server-api";

/**
 * Loads one event for the `/app/[id]/*` dashboard (build-out plan §4.3,
 * §11.1). `cache()` dedupes this across the layout and the page that share a
 * request, so navigating between dashboard tabs never fetches the event
 * twice. Never throws: callers (the layout) turn a non-2xx result into
 * `notFound()` — the API's own role check (404 for no access) is the real
 * authorization boundary, this just relays it.
 */
export const getDashboardEvent = cache((id: string): Promise<ServerApiResult<{ event: Event }>> => {
  return serverApi<{ event: Event }>(`/v1/events/${encodeURIComponent(id)}`);
});
