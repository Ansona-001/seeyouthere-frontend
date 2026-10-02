"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type User } from "@/lib/api";

type Step = "email" | "code";

export function LoginForm({ nextPath = "/app" }: { nextPath?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<void>) {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  function requestCode(e?: FormEvent) {
    e?.preventDefault();
    return run(async () => {
      await api("/v1/auth/code", { method: "POST", json: { email } });
      setCode("");
      setStep("code");
    });
  }

  function verifyCode(e: FormEvent) {
    e.preventDefault();
    return run(async () => {
      await api<{ user: User }>("/v1/auth/verify", { method: "POST", json: { email, code } });
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{step === "email" ? "Log in or sign up" : "Check your email"}</CardTitle>
        <CardDescription>
          {step === "email" ? (
            "We'll email you a 6-digit code. No password needed."
          ) : (
            <>
              We sent a code to <span className="font-medium text-foreground">{email}</span>. It expires in 10
              minutes.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" ? (
          <form onSubmit={requestCode} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Email me a code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Login code</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="text-center text-lg tracking-[0.5em]"
              />
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={pending || code.length !== 6}>
              {pending ? "Checking…" : "Log in"}
            </Button>
            <div className="flex justify-between text-sm">
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => {
                  setError(null);
                  setStep("email");
                }}
              >
                Use a different email
              </button>
              <button
                type="button"
                className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
                disabled={pending}
                onClick={() => requestCode()}
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
