"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

import { CodeForm } from "./code-form";

type EnrollResponse = { secret: string; otpauth_uri: string };

function groupSecret(secret: string): string {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

export function MfaEnroll() {
  const [enrollment, setEnrollment] = useState<EnrollResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"secret" | "uri" | null>(null);

  async function start() {
    setPending(true);
    setError(null);
    try {
      const res = await api<EnrollResponse>("/v1/admin/mfa/enroll", { method: "POST" });
      setEnrollment(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function copy(kind: "secret" | "uri", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setTimeout(() => setCopied((c) => (c === kind ? null : c)), 2000);
    } catch {
      // Clipboard access can be denied; the value is still selectable text.
    }
  }

  if (!enrollment) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          You&rsquo;ll need an authenticator app (1Password, Google Authenticator, Authy, etc.) to continue.
        </p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div>
          <Button onClick={start} disabled={pending}>
            {pending ? "Generating…" : "Set up two-factor authentication"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-sm">
          Add this key to your authenticator app, or open the setup link on your phone.
        </p>
        <div className="rounded-lg bg-muted p-3">
          <code className="block text-center font-mono text-base tracking-wider break-all">
            {groupSecret(enrollment.secret)}
          </code>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => copy("secret", enrollment.secret)}>
            {copied === "secret" ? "Copied" : "Copy key"}
          </Button>
          <Button type="button" variant="outline" onClick={() => copy("uri", enrollment.otpauth_uri)}>
            {copied === "uri" ? "Copied" : "Copy setup link"}
          </Button>
          <Button type="button" variant="outline" render={<a href={enrollment.otpauth_uri} />} nativeButton={false}>
            Open in authenticator app
          </Button>
        </div>
      </div>
      <CodeForm action="/v1/admin/mfa/verify" onVerified="/admin" submitLabel="Confirm and finish setup" />
    </div>
  );
}
