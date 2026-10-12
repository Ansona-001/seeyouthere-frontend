import { GateShell } from "@/components/brand/gate-shell";

// `visibility: "invite_only"` without a valid `syt_inv_<event>` cookie
// (build-out plan §4.4 gate order). Unlike the password gate there's nothing
// to submit here — a guest's only way in is their own invite link — so this
// is a plain server component, not a form.
export function InviteRequired() {
  return (
    <GateShell title="This invitation is private">
      <p className="text-muted-foreground">
        You&apos;ll need the invite link the host sent you to view this page.
      </p>
    </GateShell>
  );
}
