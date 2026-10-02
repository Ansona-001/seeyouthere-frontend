import Link from "next/link";

import { Button } from "@/components/ui/button";

// Uniform 404 for every "no such page" case — an unknown slug, a draft,
// a hidden/unlisted event without its link, or one taken down — so none of
// them is distinguishable from another (build-out plan §4.4, §12
// "Enumeration"). Also the global not-found boundary for any other route.
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="font-heading text-3xl font-bold tracking-tight">This page isn&apos;t available</h1>
      <p className="max-w-sm text-muted-foreground">
        It may have been moved, unpublished, or the link might not be quite right.
      </p>
      <Button render={<Link href="/" />} nativeButton={false}>
        Go home
      </Button>
    </main>
  );
}
