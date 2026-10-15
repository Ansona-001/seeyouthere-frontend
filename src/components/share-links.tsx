"use client";

import { CheckIcon, CopyIcon, Share2Icon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { displayUrl } from "@/lib/urls";

// lucide-react dropped brand icons, so WhatsApp is an inline outline SVG in the same 24px stroke style.
function WhatsAppIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

/** Copy link, WhatsApp and native share actions for a published event's public URL. */
export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [notice, setNotice] = useState("");

  function flash(text: string) {
    setNotice(text);
    setTimeout(() => setNotice(""), 4000);
  }

  async function copyLink(message = "Link copied."): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      flash(message);
      return true;
    } catch {
      // Clipboard access can be denied by the browser; the URL stays visible for copying by hand.
      return false;
    }
  }

  // The device's share sheet (phones, some desktops); falls back to copying the link elsewhere.
  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // Dismissing the share sheet rejects with AbortError; nothing to do.
      }
      return;
    }
    await copyLink();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
        <Button type="button" variant="outline" size="lg" onClick={() => copyLink()}>
          {notice ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
          {notice ? "Copied" : "Copy link"}
        </Button>
        <Button
          variant="outline"
          size="lg"
          render={
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${displayUrl(url)}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          nativeButton={false}
        >
          <WhatsAppIcon className="size-4" data-icon="inline-start" />
          WhatsApp
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={share}>
          <Share2Icon data-icon="inline-start" />
          Share
        </Button>
      </div>
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {notice}
      </p>
    </div>
  );
}
