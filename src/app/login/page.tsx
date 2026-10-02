import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/safe-next";
import { getCurrentUser } from "@/lib/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(Array.isArray(next) ? next[0] : next) ?? "/app";

  if (await getCurrentUser()) redirect(nextPath);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm nextPath={nextPath} />
    </main>
  );
}
