import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { SlugBlocklistResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { SlugBlocklist } from "./slug-blocklist";

export const metadata: Metadata = { title: "Admin: slug blocklist" };

export default async function AdminSlugsPage() {
  await requireAdminUser("/admin/slugs");
  const result = await serverApi<SlugBlocklistResponse>("/v1/admin/slug-blocklist");
  redirectIfMfaRequired(result);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl text-brand-heading">Slug blocklist</h1>
      <p className="text-sm text-muted-foreground">
        Terms here are refused as event slugs (exact match, hyphen-separated token, or substring for longer terms).
      </p>

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : (
        <SlugBlocklist initialTerms={result.data.terms} initialCursor={result.data.next_cursor} />
      )}
    </div>
  );
}
