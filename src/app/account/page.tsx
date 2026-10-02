import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionsListResponse } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";
import { getCurrentUser } from "@/lib/session";

import { DeleteAccountDialog } from "./delete-account-dialog";
import { ProfileForm } from "./profile-form";
import { SessionsList } from "./sessions-list";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const sessions = await serverApi<SessionsListResponse>("/v1/me/sessions");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="font-heading text-3xl font-bold">Account</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your name is shown to co-hosts and admins, never to guests.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialName={user.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Devices currently signed in to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.ok ? (
            <SessionsList initialSessions={sessions.data.sessions} />
          ) : (
            <Alert variant="destructive">
              <AlertDescription>{sessions.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Delete account</CardTitle>
          <CardDescription>This can&rsquo;t be undone.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground">
            <p>Deleting your account immediately:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>signs you out everywhere and removes your name and email from our records</li>
              <li>takes every event you own offline &mdash; their pages stop working right away</li>
              <li>hides any photos guests uploaded to those events</li>
            </ul>
            <p className="mt-2">
              Everything is permanently erased 30 days later. If you hold an admin role, it must be removed first.
            </p>
          </div>
          <DeleteAccountDialog email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
