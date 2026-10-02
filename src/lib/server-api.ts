import "server-only";

import { cookies } from "next/headers";

import { API_URL } from "./api";
import type { ApiErrorBody, ApiErrorDetails } from "./api-types";

// Inside Docker the web container reaches the API by service name, not the public URL.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? API_URL;

export type ServerApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; code: string; message: string; details?: ApiErrorDetails };

/**
 * Server-only fetch to the Go API for use in Server Components, layouts and
 * route handlers. Forwards every `syt_*` cookie on the incoming request
 * (session, draft, password-gate, invite, RSVP-edit — build-out plan §5) and
 * nothing else, defaults to `cache: "no-store"` (almost everything here is
 * per-visitor), and never throws for a non-2xx response: callers decide
 * between `redirect`, `notFound()` or rendering a gate based on `status`/`code`.
 *
 * Network failures (API down) are reported as `{ ok: false, status: 0,
 * code: "network_error" }` rather than throwing, so a page can show a generic
 * error state instead of crashing the whole render tree.
 */
export async function serverApi<T>(path: string, init: RequestInit = {}): Promise<ServerApiResult<T>> {
  const jar = await cookies();
  const forwarded = jar
    .getAll()
    .filter((c) => c.name.startsWith("syt_"))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const headers = new Headers(init.headers);
  if (forwarded) headers.set("Cookie", forwarded);

  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL_URL}${path}`, {
      ...init,
      cache: init.cache ?? "no-store",
      headers,
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: "network_error",
      message: "Couldn't reach the server. Please try again.",
    };
  }

  if (res.status === 204) {
    return { ok: true, status: res.status, data: undefined as T };
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    return {
      ok: false,
      status: res.status,
      code: body?.error?.code ?? "unknown",
      message: body?.error?.message ?? "Something went wrong. Please try again.",
      details: body?.error?.details,
    };
  }

  return { ok: true, status: res.status, data: (await res.json()) as T };
}
