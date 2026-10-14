/** Where help requests go. Same mailbox the app sends its own email from (MAIL_FROM), so replies reach a person. */
export const SUPPORT_EMAIL = "admin@seeyouthere.at";

/** mailto link with a fixed subject; the subject is static, so nothing user-controlled reaches the URL. */
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Help with See You There")}`;
