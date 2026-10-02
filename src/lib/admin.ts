import "server-only";

import { notFound, redirect } from "next/navigation";

import type { User } from "./api";
import { getCurrentUser } from "./session";

/**
 * Gate for `/admin/*` pages. Redirects to login when signed out, and 404s
 * when signed in without any admin role — admin routes shouldn't reveal
 * their existence to non-admins (build-out plan §12 "Enumeration").
 *
 * The 12h MFA step-up window is enforced by the API on every admin request,
 * not here: each page makes its real data fetch and calls
 * `redirectIfMfaRequired` on the result, which is the authoritative check.
 */
export async function requireAdminUser(nextPath: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (user.roles.length === 0) notFound();
  return user;
}

/** Sends the browser to the TOTP screen when an admin fetch reports the session needs step-up. */
export function redirectIfMfaRequired(result: { ok: boolean; status: number; code?: string }): void {
  if (!result.ok && result.status === 403 && result.code === "mfa_required") {
    redirect("/admin/mfa");
  }
}
