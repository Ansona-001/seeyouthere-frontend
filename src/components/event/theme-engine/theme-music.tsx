"use client";

import { useEffect, useRef, useState } from "react";

const VOLUME = 0.5;
const MAX_BLOB_BYTES = 6 * 1024 * 1024;
// Scroll and wheel never count as a user gesture for autoplay, but trying again on them is cheap and
// harmless; pointer, touch, click and key presses are what actually unlock sound.
const INTERACTIONS = ["pointerdown", "touchstart", "touchend", "click", "keydown", "wheel", "scroll"] as const;

/**
 * Background music with a round speaker button (bottom right) to pause or resume. It tries to start
 * as soon as the page opens. If the browser refuses sound before the visitor has interacted, the track
 * runs silently and becomes audible with their first scroll, tap, click or key press, fading in. A
 * visitor who pauses it keeps it paused. It pauses while the tab is hidden, and stays off entirely
 * when the visitor has asked for reduced data.
 *
 * `src` is a same-origin path. With `download` (host-uploaded tracks) the file is fetched whole and
 * played from a blob URL, because iOS Safari will not stream audio from a server without Range support.
 * Every failure leaves the page silent and quiet.
 */
export function ThemeMusic({ src, download = false }: { src: string; download?: boolean }) {
  const [ready, setReady] = useState(!download);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const userPaused = useRef(false);

  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData || window.matchMedia("(prefers-reduced-data: reduce)").matches) return;

    const abort = new AbortController();
    let objectUrl: string | undefined;
    let ramp: number | undefined;
    let el: HTMLAudioElement | undefined;
    let cleanup = () => {};

    function begin(url: string) {
      const a = new Audio(url);
      el = a;
      a.loop = true;
      a.volume = 0;
      audio.current = a;
      let audible = false;
      let trying = false;

      const stopListening = () => INTERACTIONS.forEach((e) => window.removeEventListener(e, attempt, true));
      function onAudible() {
        audible = true;
        stopListening();
        setPlaying(true);
        // Ease the volume in over about two seconds.
        window.clearInterval(ramp);
        ramp = window.setInterval(() => {
          a.volume = Math.min(VOLUME, a.volume + 0.025);
          if (a.volume >= VOLUME) window.clearInterval(ramp);
        }, 100);
      }
      function attempt() {
        if (userPaused.current || audible || trying || document.hidden) return;
        trying = true;
        a.muted = false;
        a.play()
          .then(onAudible, () => {
            // Still blocked: stay silent and wait for the next interaction.
          })
          .finally(() => {
            trying = false;
          });
      }

      INTERACTIONS.forEach((e) => window.addEventListener(e, attempt, { capture: true, passive: true }));
      // Try with sound first; if refused, run muted (always allowed) so the unmute on first interaction is instant.
      a.play().then(onAudible, () => {
        a.muted = true;
        void a.play().catch(() => {});
      });

      const onVisibility = () => {
        if (document.hidden) a.pause();
        else if (!userPaused.current && (audible || a.muted)) void a.play().catch(() => {});
      };
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        stopListening();
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    const start = () => {
      if (download) {
        (async () => {
          try {
            const res = await fetch(src, { signal: abort.signal, credentials: "omit" });
            if (!res.ok || !(res.headers.get("content-type") ?? "").toLowerCase().startsWith("audio/mpeg")) return;
            const blob = await res.blob();
            if (abort.signal.aborted || blob.size === 0 || blob.size > MAX_BLOB_BYTES) return;
            objectUrl = URL.createObjectURL(new Blob([blob], { type: "audio/mpeg" }));
            setReady(true);
            begin(objectUrl);
          } catch (err) {
            if (!abort.signal.aborted) console.debug("theme music unavailable", err);
          }
        })();
      } else {
        begin(src);
      }
    };
    // Start once the page's own images and fonts are in, so the track (up to 5 MB) never competes with the first screen.
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      window.removeEventListener("load", start);
      abort.abort();
      cleanup();
      window.clearInterval(ramp);
      el?.pause();
      audio.current = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, download]);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (playing && !el.paused && !el.muted) {
      userPaused.current = true;
      el.pause();
      setPlaying(false);
    } else {
      userPaused.current = false;
      el.muted = false;
      el.volume = VOLUME;
      void el.play().then(() => setPlaying(true), () => {});
    }
  };

  if (!ready) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Pause music" : "Play music"}
      className="fixed right-4 bottom-4 z-40 grid size-11 place-items-center rounded-full bg-(--ev-surface) text-(--ev-accent-ink) shadow-md ring-1 ring-(--ev-accent)/25 transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ev-accent-ink) active:scale-95"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" stroke="none" />
        {playing ? (
          <>
            <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
            <path d="M18 6.8a7.5 7.5 0 0 1 0 10.4" />
          </>
        ) : (
          <path d="m16 9.5 5 5m0-5-5 5" />
        )}
      </svg>
    </button>
  );
}
