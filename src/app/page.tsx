import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-6xl">
          One link for your whole event
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Free event pages for birthdays, weddings, housewarmings and every other gathering. Share
          the details, collect RSVPs.
        </p>
        <p className="mt-8 font-heading text-2xl font-bold sm:text-3xl">
          seeuthere<span className="text-amber-600">.at</span>
          <span className="text-teal-700">/priya-birthday</span>
        </p>
        <Button className="mt-10" size="lg" render={<Link href="/login" />} nativeButton={false}>
          Get started
        </Button>
      </div>
    </main>
  );
}
