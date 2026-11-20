import { QrCode } from "@/components/qr-code";
import type { EntryPass as EntryPassData } from "@/lib/api-types";
import { passUrl } from "@/lib/pass";

/**
 * The guest's entry pass for a hosted event: a QR code the host scans at the door. Brand chrome, not the event
 * theme, so the code always keeps a high-contrast white tile. The token is the pass; it is never shown as text.
 */
export function EntryPass({ pass, guestName, title }: { pass: EntryPassData; guestName: string; title: string }) {
  const checkedIn = pass.checked_in_at !== null;
  return (
    <section
      aria-labelledby="entry-pass-title"
      className="bg-background px-4 py-10 text-foreground sm:px-6"
    >
      <div className="mx-auto grid w-full max-w-sm justify-items-center gap-4 rounded-3xl bg-card px-6 py-8 text-center shadow-md ring-1 ring-border">
        <h2 id="entry-pass-title" className="font-heading text-2xl text-brand-heading">
          Your entry pass
        </h2>
        <p className="text-muted-foreground">
          {title} · {guestName}
        </p>
        <div className={checkedIn ? "opacity-40" : undefined}>
          <QrCode value={passUrl(pass.token)} label={`Entry pass QR code for ${guestName}`} className="size-64" />
        </div>
        <p className="font-semibold">
          Admits {pass.admits} {pass.admits === 1 ? "person" : "people"}
        </p>
        {checkedIn ? (
          <p role="status" className="rounded-full bg-secondary px-4 py-1.5 font-semibold text-secondary-foreground">
            Checked in
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Show this at the door. Turn your screen brightness up so it scans quickly.
          </p>
        )}
      </div>
    </section>
  );
}
