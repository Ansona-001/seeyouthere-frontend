import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { getCurrentUser } from "@/lib/session";

import { EventForm } from "./event-form";

export const metadata: Metadata = {
  title: "Host an event",
  description: "Create a website for your event with a programme, registration and door check-in.",
  robots: { index: false, follow: false },
};

// Hosting needs an account (registrations, passes and check-in all belong to an owner), so unlike the invite
// flow there is no anonymous draft: sign in first and come straight back here.
export default async function CreateEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/create/event")}`);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-heading text-3xl text-brand-heading sm:text-4xl">Host an event</h1>
        <p className="mt-2 mb-6 text-muted-foreground">
          Your event gets its own website: about, date and time, programme, venue and registration. Start with the
          basics here; you can edit every section next.
        </p>
        <EventForm />
      </div>
    </AppShell>
  );
}
