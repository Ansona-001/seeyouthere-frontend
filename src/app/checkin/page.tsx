import type { Metadata } from "next";

import { CheckInLink } from "./check-in-link";

// The pass token lives in the URL fragment; keep this page out of search results.
export const metadata: Metadata = { title: "Entry pass", robots: { index: false, follow: false } };

export default function CheckInPage() {
  return <CheckInLink />;
}
