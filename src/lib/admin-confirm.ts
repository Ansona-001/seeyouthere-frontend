// Typed-confirmation rules for destructive admin actions. The API enforces the
// same rules; these only decide when the confirm button is enabled.

/** The word an admin types to delete an event that has no slug yet. */
export const EVENT_DELETE_FALLBACK = "delete";

/** Matches the server: trimmed and case-insensitive, like login. */
export function emailConfirmMatches(typed: string, email: string): boolean {
  const want = email.trim().toLowerCase();
  return want !== "" && typed.trim().toLowerCase() === want;
}

/** What must be typed to delete an event: its slug, or "delete" when it has none. */
export function eventConfirmTarget(slug: string | null): string {
  return slug ? slug : EVENT_DELETE_FALLBACK;
}

/** Exact, case-sensitive match against the slug (or the fallback word). */
export function eventConfirmMatches(typed: string, slug: string | null): boolean {
  return typed === eventConfirmTarget(slug);
}

const GENERIC = "Couldn't reach the server. Please try again.";

/** Friendly message for the error codes the admin delete/edit endpoints return. */
export function adminErrorMessage(err: { status: number; code: string; message: string } | null): string {
  if (!err) return GENERIC;
  if (err.status === 429) return "Too many attempts. Please wait a while and try again.";
  switch (err.code) {
    case "confirm_mismatch":
      return "What you typed doesn't match. Check it and try again.";
    case "has_admin_role":
      return "This person still holds an admin role. Remove their roles first, then delete the account.";
    case "user_banned":
      return "Banned accounts are kept so the ban stays in force. Unban first if you really need to delete.";
    case "email_taken":
      return "Another account already uses that email.";
    case "storage_unavailable":
      return "File storage isn't responding. The event wasn't deleted; please try again in a moment.";
    case "forbidden":
      return "You don't have permission to do that.";
    case "not_found":
      return "That item no longer exists.";
    default:
      return err.message || GENERIC;
  }
}
