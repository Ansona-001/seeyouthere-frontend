import { requireAdminUser } from "@/lib/admin";

import { AdminNav } from "./nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdminUser("/admin");

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav roles={user.roles} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  );
}
