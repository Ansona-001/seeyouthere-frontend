import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminUserDetail } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { serverApi } from "@/lib/server-api";

import { DeleteUserDialog } from "./delete-user-dialog";
import { EditUserForm } from "./edit-user-form";
import { UserActions } from "./user-actions";

export const metadata: Metadata = { title: "Admin: user" };

export default async function AdminUserDetailPage({
  params,
}: PageProps<"/admin/users/[id]">) {
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

  const { user, counts, audit, deleted_at } = result.data;
  const deleted = Boolean(deleted_at);
  const isSelf = user.id === viewer.id;
  const isSuperAdmin = viewer.roles.includes("super_admin");
  const canEdit = isSuperAdmin || viewer.roles.includes("moderator");
  const targetHasRole = user.roles.length > 0;
  // Same rule as the status actions: only a super admin may act on a role holder.
  const editBlocked = isSelf
    ? "You can’t edit your own account here."
    : targetHasRole && !isSuperAdmin
      ? "Only a super admin can edit a user who holds a role."
      : null;
  const deleteBlocked = isSelf
    ? "You can’t delete your own account here."
    : targetHasRole
      ? "This user holds an admin role. Remove their roles first, then you can delete the account."
      : user.status === "banned"
        ? "Banned accounts are kept so the ban stays in force. Unban first if you really need to delete."
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/users"
          className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:underline"
        >
          ← Users
        </Link>
        <h1 className="font-heading text-2xl text-brand-heading">
          {deleted ? "Deleted user" : user.name || "(no name)"}{" "}
          {deleted && <Badge variant="destructive">Deleted</Badge>}
        </h1>
        {deleted ? (
          <p className="text-muted-foreground">
            This account was deleted on {formatDateTime(deleted_at as string)}.
            Nothing more can be done to it.
          </p>
        ) : (
          <p className="text-muted-foreground">{user.email}</p>
        )}
      </div>

      {!deleted && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Status &amp; roles</CardTitle>
              <CardDescription>
                <Badge
                  variant={
                    user.status === "active" ? "secondary" : "destructive"
                  }
                >
                  {user.status}
                </Badge>{" "}
                {user.roles.length > 0
                  ? `Roles: ${user.roles.join(", ")}`
                  : "No admin role"}{" "}
                · joined {formatDateTime(user.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserActions
                target={user}
                viewerId={viewer.id}
                viewerRoles={viewer.roles}
              />
            </CardContent>
          </Card>

          {canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
                {editBlocked && (
                  <CardDescription>{editBlocked}</CardDescription>
                )}
              </CardHeader>
              {!editBlocked && (
                <CardContent>
                  <EditUserForm
                    userId={user.id}
                    name={user.name}
                    email={user.email}
                    canEditEmail={isSuperAdmin && !targetHasRole}
                    emailLockedReason={
                      isSuperAdmin && targetHasRole
                        ? "The email of a user who holds an admin role can’t be changed here. Remove their roles first."
                        : null
                    }
                  />
                </CardContent>
              )}
            </Card>
          )}

          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Delete user</CardTitle>
                <CardDescription>
                  Permanently deletes the account and the events they own. This
                  can&rsquo;t be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {deleteBlocked && (
                  <p
                    id="delete-user-blocked"
                    className="text-sm text-muted-foreground"
                  >
                    {deleteBlocked}
                  </p>
                )}
                <div>
                  {deleteBlocked ? (
                    <Button
                      variant="destructive"
                      disabled
                      aria-describedby="delete-user-blocked"
                    >
                      Delete this user…
                    </Button>
                  ) : (
                    <DeleteUserDialog
                      userId={user.id}
                      email={user.email}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            {counts.events} event{counts.events === 1 ? "" : "s"} ·{" "}
            {counts.sessions} active session
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
                <li
                  key={entry.id}
                  className="flex justify-between gap-4 border-b pb-2 last:border-0 last:pb-0"
                >
                  <span>{entry.action}</span>
                  <span className="text-muted-foreground">
                    {formatDateTime(entry.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
