import { CodeForm } from "./code-form";

export function MfaVerify() {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">Enter the current code from your authenticator app.</p>
      <CodeForm action="/v1/admin/mfa/verify" onVerified="/admin" submitLabel="Verify" />
    </div>
  );
}
