"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type AdminRole, type AdminUserSummary, type UserStatus } from "@/lib/api";

const ROLES: AdminRole[] = ["support", "moderator", "super_admin"];

export function UserActions({
  target,
  viewerId,
  viewerRoles,
}: {
  target: AdminUserSummary;
  viewerId: string;
  viewerRoles: string[];
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSelf = target.id === viewerId;
  const isSuperAdmin = viewerRoles.includes("super_admin");
  // Only a super_admin may act on someone who already holds an admin role.
  const targetHasRole = target.roles.length > 0;
  const locked = isSelf || (targetHasRole && !isSuperAdmin);

  async function run(key: string, action: () => Promise<void>) {
    setPending(key);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(null);
    }
  }

  function setStatus(status: UserStatus) {
    return run(`status:${status}`, () =>
      api(`/v1/admin/users/${target.id}/status`, { method: "POST", json: { status, reason: reason.slice(0, 500) } }),
    );
  }

  function toggleRole(role: AdminRole, grant: boolean) {
    return run(`role:${role}`, () =>
      api(`/v1/admin/users/${target.id}/roles/${role}`, { method: grant ? "POST" : "DELETE" }),
    );
  }

  function revokeSessions() {
    return run("revoke", () => api(`/v1/admin/users/${target.id}/sessions/revoke`, { method: "POST" }));
  }

  function resetMfa() {
    return run("mfa", () => api(`/v1/admin/users/${target.id}/mfa/reset`, { method: "POST" }));
  }

  return (
    <div className="flex flex-col gap-4">
      {isSelf && <p className="text-sm text-muted-foreground">You can&rsquo;t act on your own account.</p>}
      {targetHasRole && !isSuperAdmin && !isSelf && (
        <p className="text-sm text-muted-foreground">Only a super admin can act on a user who holds a role.</p>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-2">
        <Label htmlFor="reason">Reason (for suspend/ban)</Label>
        <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} disabled={locked} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={locked || pending !== null || target.status === "active"}
          onClick={() => setStatus("active")}
        >
          {pending === "status:active" ? "Reactivating…" : "Reactivate"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={locked || pending !== null || target.status === "suspended"}
          onClick={() => setStatus("suspended")}
        >
          {pending === "status:suspended" ? "Suspending…" : "Suspend"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={locked || !isSuperAdmin || pending !== null || target.status === "banned"}
          onClick={() => setStatus("banned")}
        >
          {pending === "status:banned" ? "Banning…" : "Ban"}
        </Button>
        <Button variant="outline" size="sm" disabled={locked || pending !== null} onClick={revokeSessions}>
          {pending === "revoke" ? "Revoking…" : "Revoke sessions"}
        </Button>
      </div>

      {isSuperAdmin && (
        <div className="grid gap-2 border-t pt-3">
          <span className="text-sm font-medium">Admin roles</span>
          <div className="flex flex-wrap gap-3">
            {ROLES.map((role) => {
              const has = target.roles.includes(role);
              return (
                <label key={role} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={has}
                    disabled={isSelf || pending !== null}
                    onChange={(e) => toggleRole(role, e.target.checked)}
                    className="size-4 rounded border-input"
                  />
                  {role}
                </label>
              );
            })}
          </div>
          <div>
            <Button variant="outline" size="sm" disabled={isSelf || pending !== null} onClick={resetMfa}>
              {pending === "mfa" ? "Resetting…" : "Reset two-factor authentication"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
