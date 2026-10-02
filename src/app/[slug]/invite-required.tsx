// `visibility: "invite_only"` without a valid `syt_inv_<event>` cookie
// (build-out plan §4.4 gate order). Unlike the password gate there's nothing
// to submit here — a guest's only way in is their own invite link — so this
// is a plain server component, not a form.
export function InviteRequired() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-medium">This invitation is private</h1>
      <p className="text-muted-foreground">
        You&apos;ll need the invite link the host sent you to view this page.
      </p>
    </main>
  );
}
