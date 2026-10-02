import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import type { User } from "./api";
import { serverApi } from "./server-api";

const SESSION_COOKIE = "syt_session";

/** The logged-in user, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // Skip the round trip entirely when there's no session cookie to send.
  if (!(await cookies()).has(SESSION_COOKIE)) return null;

  const result = await serverApi<{ user: User }>("/v1/me");
  if (!result.ok) {
    if (result.status === 401) return null;
    throw new Error(`GET /v1/me failed: ${result.status} ${result.code}`);
  }
  return result.data.user;
});
