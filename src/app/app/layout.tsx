import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { getCurrentUser } from "@/lib/session";

// Auth gate for every `/app/*` dashboard route (build-out plan §11.1). The API is the real enforcement on every
// request the pages below make; this only saves a signed-out visitor the round trip.
export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fapp");

  return <AppShell>{children}</AppShell>;
}
