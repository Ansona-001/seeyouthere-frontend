import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminUserDetail } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { serverApi } from "@/lib/server-api";

import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Admin: user" };

export default async function AdminUserDetailPage({ params }: PageProps<"/admin/users/[id]">) {
  const viewer = await requireAdminUser("/admin/users");
  const { id } = await params;
  const result = await serverApi<AdminUserDetail>(`/v1/admin/users/${id}`);
  redirectIfMfaRequired(result);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p role="alert" className="text-sm text-destructive">
        {result.message}
      </p>
    );
  }

  const { user, counts, audit } = result.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:underline">
          ← Users
        </Link>
        <h1 className="font-heading text-2xl font-bold">{user.name || "(no name)"}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status &amp; roles</CardTitle>
          <CardDescription>
            <Badge variant={user.status === "active" ? "secondary" : "destructive"}>{user.status}</Badge>{" "}
            {user.roles.length > 0 ? `Roles: ${user.roles.join(", ")}` : "No admin role"} · joined{" "}
            {formatDateTime(user.created_at)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserActions target={user} viewerId={viewer.id} viewerRoles={viewer.roles} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            {counts.events} event{counts.events === 1 ? "" : "s"} · {counts.sessions} active session
            {counts.sessions === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent audit entries</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {audit.map((entry) => (
                <li key={entry.id} className="flex justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
                  <span>{entry.action}</span>
                  <span className="text-muted-foreground">{formatDateTime(entry.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
