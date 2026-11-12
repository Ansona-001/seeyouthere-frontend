// Premium design unlock helpers. Payment is manual: the host chats on WhatsApp, pays off-platform and
// an admin marks the event paid, so all the client needs is price labels and a safe wa.me link.

import type { Currency, Region, RegionPrice } from "./api-types.ts";

const FORMATTERS: Record<Currency, Intl.NumberFormat> = {
  INR: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }),
  AED: new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
};

/** "₹599", "AED 29" or "$9" from minor units (paise / fils / cents). */
export function formatMoney(currency: Currency, amountMinor: number): string {
  return FORMATTERS[currency].format(amountMinor / 100);
}

export const REGION_LABELS: Record<Region, string> = { IN: "India", AE: "UAE", INT: "Rest of world" };

const REGION_STORAGE_KEY = "syt_pay_region";

function isRegion(v: unknown): v is Region {
  return v === "IN" || v === "AE" || v === "INT";
}

/** Best-effort region guess from the time zone, then the language's region subtag; "INT" when unsure. Pure. */
export function detectRegion(timeZone: string | undefined, languages: readonly string[]): Region {
  if (timeZone === "Asia/Kolkata" || timeZone === "Asia/Calcutta") return "IN";
  if (timeZone === "Asia/Dubai") return "AE";
  for (const lang of languages) {
    const subtag = lang.split("-")[1]?.toUpperCase();
    if (subtag === "IN") return "IN";
    if (subtag === "AE") return "AE";
  }
  return "INT";
}

/** Picks among the offered prices only: preferred if offered, else IN, else the first offered. */
export function pickRegion(preferred: Region | null, prices: readonly RegionPrice[]): Region | null {
  if (preferred && prices.some((p) => p.region === preferred)) return preferred;
  if (prices.some((p) => p.region === "IN")) return "IN";
  return prices[0]?.region ?? null;
}

/** The host's remembered choice, else the detected region (browser only; never throws). */
export function initialRegion(prices: readonly RegionPrice[]): Region | null {
  let preferred: Region | null = null;
  try {
    const saved = window.localStorage.getItem(REGION_STORAGE_KEY);
    if (isRegion(saved)) preferred = saved;
  } catch {
    // storage blocked: fall through to detection
  }
  if (!preferred) {
    try {
      preferred = detectRegion(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.languages ?? [navigator.language]);
    } catch {
      preferred = null;
    }
  }
  return pickRegion(preferred, prices);
}

/** Remembers the host's manual region choice (per-viewer convenience only). */
export function rememberRegion(region: Region): void {
  try {
    window.localStorage.setItem(REGION_STORAGE_KEY, region);
  } catch {
    // ignore
  }
}

/** International number, digits only, no "+": 8-15 digits. Anything else is treated as unset. */
export function validWhatsappNumber(raw: string | undefined): string | null {
  const n = raw?.trim() ?? "";
  return /^[1-9]\d{7,14}$/.test(n) ? n : null;
}

/** https://wa.me link with a prefilled message, or null when the number is unset or invalid. */
export function whatsappUrl(number: string | undefined, message: string): string | null {
  const valid = validWhatsappNumber(number);
  return valid ? `https://wa.me/${valid}?text=${encodeURIComponent(message)}` : null;
}

/** Admin price input: whole rupees, 1..10000 (the API stores paise, 100..1000000). Returns paise or null. */
export function rupeesToPaise(input: string): number | null {
  const t = input.trim();
  if (!/^\d{1,5}$/.test(t)) return null;
  const rupeeCount = Number(t);
  return rupeeCount >= 1 && rupeeCount <= 10000 ? rupeeCount * 100 : null;
}

/** Admin regional price input: whole units (dirhams / dollars), 1..10000, or blank for "not offered" (null). Returns minor units, null (blank) or undefined (invalid). */
export function wholeUnitsToMinor(input: string): number | null | undefined {
  if (input.trim() === "") return null;
  return rupeesToPaise(input) ?? undefined;
}
