"use client";

import { useEffect, useRef, useState } from "react";

import { MUSIC_TRACKS, type MusicTrack } from "./music-tracks";

const VOLUME = 0.5;

/**
 * Background music for a theme that asks for it, with a round speaker button
 * (bottom right) to pause or resume. It starts as soon as the page opens. If
 * the browser refuses sound before the visitor has interacted, the track runs
 * silently and becomes audible with their first tap, click or key press, fading
 * in. A visitor who pauses it keeps it paused. It pauses while the tab is hidden.
 */
export function ThemeMusic({ track }: { track: MusicTrack }) {
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const userPaused = useRef(false);

  useEffect(() => {
    const el = new Audio(MUSIC_TRACKS[track]);
    el.loop = true;
    el.volume = 0;
    audio.current = el;

    let ramp: number | undefined;
    let audible = false;
    const events = ["click", "keydown", "touchend"] as const;
    const stopListening = () => events.forEach((e) => document.removeEventListener(e, attempt));

    function onAudible() {
      audible = true;
      stopListening();
      setPlaying(true);
      // Ease the volume in over about two seconds.
      window.clearInterval(ramp);
      ramp = window.setInterval(() => {
        el.volume = Math.min(VOLUME, el.volume + 0.025);
        if (el.volume >= VOLUME) window.clearInterval(ramp);
      }, 100);
    }
    function attempt() {
      if (userPaused.current) return;
      el.muted = false;
      el.play().then(onAudible, () => {
        // Still blocked: stay silent and wait for the next interaction.
      });
    }

    events.forEach((e) => document.addEventListener(e, attempt));
    // Try with sound first; if refused, run muted (always allowed) so the unmute on first interaction is instant.
    el.play().then(onAudible, () => {
      el.muted = true;
      void el.play().catch(() => {});
    });

    const onVisibility = () => {
      if (document.hidden) el.pause();
      else if (!userPaused.current && (audible || el.muted)) void el.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopListening();
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(ramp);
      el.pause();
      audio.current = null;
    };
  }, [track]);

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
