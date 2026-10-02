import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminUser } from "@/lib/admin";

import { MfaEnroll } from "./mfa-enroll";
import { MfaVerify } from "./mfa-verify";

export const metadata: Metadata = { title: "Admin verification" };

export default async function AdminMfaPage() {
  const user = await requireAdminUser("/admin/mfa");
  if (user.mfa?.verified) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-md py-4">
      <Card>
        <CardHeader>
          <CardTitle>Two-factor verification</CardTitle>
          <CardDescription>
            Admin actions require a verified authenticator app on this device, refreshed every 12 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>{user.mfa?.enrolled ? <MfaVerify /> : <MfaEnroll />}</CardContent>
      </Card>
    </div>
  );
}
