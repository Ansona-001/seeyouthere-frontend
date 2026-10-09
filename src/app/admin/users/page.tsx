import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirectIfMfaRequired, requireAdminUser } from "@/lib/admin";
import type { AdminUsersListResponse, UserStatus } from "@/lib/api-types";
import { serverApi } from "@/lib/server-api";

import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Admin: users" };

const STATUSES: UserStatus[] = ["active", "suspended", "banned"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminUser("/admin/users");
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 80);
  const status = params.status && STATUSES.includes(params.status as UserStatus) ? params.status : "";

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  const basePath = `/v1/admin/users${query.size ? `?${query}` : ""}`;

  const result = await serverApi<AdminUsersListResponse>(basePath);
  redirectIfMfaRequired(result);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl text-brand-heading">Users</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" defaultValue={q} placeholder="Name or email" className="w-full sm:w-64" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="status">Status</Label>
          <NativeSelect
            id="status"
            name="status"
            defaultValue={status}
            className="min-w-36"
          >
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {!result.ok ? (
        <Alert variant="destructive">
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      ) : result.data.users.length === 0 ? (
        <p className="rounded-xl border border-dashed border-input bg-card px-4 py-6 text-center text-sm text-muted-foreground">No users match.</p>
      ) : (
        <UsersTable
          initialUsers={result.data.users}
          initialCursor={result.data.next_cursor}
          basePath={basePath}
        />
      )}
    </div>
  );
}
