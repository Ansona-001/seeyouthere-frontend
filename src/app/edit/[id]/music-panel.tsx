"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { customMusicSrc } from "@/components/event/theme-engine/music-tracks";
import { api, ApiError, type EventAudio, type MusicSource } from "@/lib/api";

const MAX_BYTES = 5 * 1024 * 1024;

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatLength(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function uploadError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Log in to add your own music.";
    if (err.status === 413) return "That file is too big. Please use an MP3 under 5 MB.";
    if (err.status === 429) return "That's a lot of uploads. Please wait a few minutes and try again.";
    return err.message;
  }
  return "Couldn't upload that file. Please try again.";
}

/**
 * Chooses the music guests hear on the public page: the design's own track, the host's uploaded MP3,
 * or nothing. "My own music" is saved only once an upload has succeeded, so the server never sees a
 * custom choice without a file.
 */
export function MusicPanel({
  eventId,
  source,
  audio,
  templateMusic,
  signedIn,
  onSave,
  onAudio,
}: {
  eventId: string;
  source: MusicSource;
  audio: EventAudio | null;
  /** Whether the design has built-in music; null when the server hides it (it clears the theme's music for "custom" and "none"). */
  templateMusic: boolean | null;
  signedIn: boolean;
  onSave: (source: MusicSource) => Promise<boolean>;
  onAudio: (audio: EventAudio | null) => void;
}) {
  const name = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<"saving" | "uploading" | "removing" | null>(null);
  const [error, setError] = useState<string | null>(null);
  // "My own music" chosen but nothing uploaded yet; nothing has been sent to the server.
  const [choosingCustom, setChoosingCustom] = useState(false);
  const selected: MusicSource = choosingCustom || source === "custom" ? "custom" : source;
  const busy = pending !== null;

  const preview = useRef<{ el: HTMLAudioElement; url: string } | null>(null);
  // Bumped whenever a preview is stopped or the file changes, so a fetch still in flight cannot start playing late.
  const previewRun = useRef(0);
  const [previewing, setPreviewing] = useState<"idle" | "loading" | "playing">("idle");
  const audioSrc = audio?.src;

  function stopPreview() {
    previewRun.current += 1;
    const p = preview.current;
    preview.current = null;
    if (p) {
      p.el.pause();
      URL.revokeObjectURL(p.url);
    }
    setPreviewing("idle");
  }
  // The preview belongs to one file: stop it when the file changes, is removed, or the panel unmounts.
  useEffect(() => {
    return () => {
      previewRun.current += 1;
      const p = preview.current;
      preview.current = null;
      if (p) {
        p.el.pause();
        URL.revokeObjectURL(p.url);
      }
    };
  }, [audioSrc]);

  async function togglePreview() {
    if (!audio || previewing === "loading") return;
    if (previewing === "playing") {
      stopPreview();
      return;
    }
    const src = customMusicSrc(audio.src);
    if (!src) return;
    setError(null);
    setPreviewing("loading");
    const run = ++previewRun.current;
    let url: string | null = null;
    try {
      // A blob plays everywhere, including iOS Safari, which needs Range support the server does not offer.
      const res = await fetch(src, { credentials: "omit" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      if (run !== previewRun.current) return; // stopped, or the panel/file changed, while loading
      url = URL.createObjectURL(new Blob([blob], { type: "audio/mpeg" }));
      const el = new Audio(url);
      el.addEventListener("ended", stopPreview);
      preview.current = { el, url };
      await el.play();
      if (run !== previewRun.current) return;
      setPreviewing("playing");
    } catch {
      if (url && preview.current?.url !== url) URL.revokeObjectURL(url);
      stopPreview();
      setError("Couldn't play that track. Try uploading it again.");
    }
  }

  async function run(kind: "saving" | "uploading" | "removing", action: () => Promise<void>) {
    if (busy) return;
    setPending(kind);
    setError(null);
    try {
      await action();
    } finally {
      setPending(null);
    }
  }

  async function choose(next: MusicSource) {
    if (next === "custom" && !signedIn) return;
    stopPreview();
    if (next === "custom" && !audio) {
      setChoosingCustom(true);
      return;
    }
    if (next === source && !choosingCustom) return;
    const previous = choosingCustom;
    setChoosingCustom(false);
    await run("saving", async () => {
      const ok = await onSave(next);
      if (!ok && previous) setChoosingCustom(true);
    });
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const looksLikeMp3 = /\.mp3$/i.test(file.name) || file.type === "audio/mpeg";
    if (!looksLikeMp3) {
      setError("Please choose an MP3 file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${formatSize(file.size)}. Please use an MP3 under 5 MB.`);
      return;
    }
    if (file.size === 0) {
      setError("That file is empty. Please choose another MP3.");
      return;
    }
    stopPreview();
    await run("uploading", async () => {
      try {
        const res = await api<{ audio: EventAudio }>(`/v1/events/${encodeURIComponent(eventId)}/audio`, {
          method: "POST",
          body: file,
          headers: { "Content-Type": "audio/mpeg" },
        });
        onAudio(res.audio);
      } catch (err) {
        setError(uploadError(err));
        return;
      }
      if (await onSave("custom")) setChoosingCustom(false);
    });
  }

  async function remove() {
    await run("removing", async () => {
      stopPreview();
      // Switch the page to no music first so it never points at a file that is gone.
      if (source === "custom" && !(await onSave("none"))) return;
      try {
        await api<void>(`/v1/events/${encodeURIComponent(eventId)}/audio`, { method: "DELETE" });
        onAudio(null);
        setChoosingCustom(false);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't remove that track. Please try again.");
      }
    });
  }

  const options: { value: MusicSource; label: string; hint: string; disabled?: boolean }[] = [
    {
      value: "template",
      label: "Template music",
      hint: templateMusic === false ? "This design has no music" : "The tune that comes with this design.",
      disabled: templateMusic === false,
    },
    {
      value: "custom",
      label: "My own music",
      hint: signedIn ? "Upload an MP3 up to 5 MB." : "Log in to add your own music.",
      disabled: !signedIn,
    },
    { value: "none", label: "No music", hint: "Your page stays quiet." },
  ];

  return (
    <fieldset disabled={busy} className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">Music on your page</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 text-sm transition-[background-color,border-color,box-shadow] duration-(--duration-fast) has-focus-visible:ring-3 has-focus-visible:ring-ring/50 has-disabled:cursor-default has-disabled:opacity-60 ${
            selected === o.value ? "border-primary bg-secondary ring-2 ring-ring/40" : "border-input [@media(hover:hover)]:hover:bg-accent"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={selected === o.value}
            disabled={o.disabled}
            onChange={() => choose(o.value)}
            className="mt-0.5 size-4 shrink-0 accent-primary"
          />
          <span className="flex flex-col">
            <span className="font-medium">{o.label}</span>
            <span className="text-muted-foreground">{o.hint}</span>
          </span>
        </label>
      ))}

      {selected === "custom" && signedIn && (
        <div className="mt-1 flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="audio/mpeg,.mp3"
            aria-label="Choose an MP3 file"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {audio && (
            <p className="text-sm text-muted-foreground">
              MP3 · {formatSize(audio.size_bytes)} · {formatLength(audio.duration_ms)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {audio && (
              <Button type="button" variant="outline" size="sm" disabled={previewing === "loading"} onClick={togglePreview}>
                {previewing === "playing" ? "Stop" : previewing === "loading" ? "Loading…" : "Play"}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              {pending === "uploading" ? "Uploading…" : audio ? "Replace" : "Upload MP3"}
            </Button>
            {audio && (
              <Button type="button" variant="outline" size="sm" onClick={remove}>
                {pending === "removing" ? "Removing…" : "Remove"}
              </Button>
            )}
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <p role="status" className="sr-only">
        {pending === "saving" ? "Saving…" : pending === "uploading" ? "Uploading…" : pending === "removing" ? "Removing…" : ""}
      </p>
    </fieldset>
  );
}
