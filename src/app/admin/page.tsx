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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {TILES.map((tile) => (
        <Card key={tile.key}>
          <CardHeader>
            <CardDescription>{tile.label}</CardDescription>
            <CardTitle className="text-3xl">{result.data[tile.key]}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
