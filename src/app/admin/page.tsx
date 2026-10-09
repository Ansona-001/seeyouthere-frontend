import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminOverview } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

export const metadata: Metadata = { title: "Admin overview" };

const TILES: { key: keyof AdminOverview; label: string }[] = [
  { key: "open_reports", label: "Open reports" },
  { key: "pending_photos", label: "Pending guest photos" },
  { key: "new_users_7d", label: "New users (7 days)" },
  { key: "events_published_7d", label: "Events published (7 days)" },
];

export default async function AdminOverviewPage() {
  await requireAdminUser("/admin");
  const result = await serverApi<AdminOverview>("/v1/admin/overview");
  redirectIfMfaRequired(result);

  if (!result.ok) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
    <h1 className="font-heading text-2xl text-brand-heading">Overview</h1>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {TILES.map((tile) => (
        <Card key={tile.key}>
          <CardHeader>
            <CardDescription>{tile.label}</CardDescription>
            <CardTitle className="text-4xl tabular-nums">{result.data[tile.key]}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
    </div>
  );
}
