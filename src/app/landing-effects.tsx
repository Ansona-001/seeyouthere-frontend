"use client";

import { useEffect } from "react";

/**
 * Progressive motion for the landing page's server-rendered sections; renders nothing.
 * - `[data-reveal]` elements that start below the fold are marked "pending" (hidden by globals.css)
 *   and switched to "in" the first time they scroll into view. Anything already on screen is left alone.
 * - `[data-tilt]` tiles expose the pointer position as `--rx` / `--ry` so their card can lean toward it.
 * Both are skipped under reduced motion, and tilt also on devices without hover.
 */
export function LandingEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const listeners = new AbortController();
    const pending: HTMLElement[] = [];
    let observer: IntersectionObserver | null = null;

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.setAttribute("data-reveal", "in");
            io.unobserve(entry.target);
          }
        },
        { threshold: 0.15 },
      );
      observer = io;
      for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
        if (el.getBoundingClientRect().top < window.innerHeight) continue;
        el.dataset.reveal = "pending";
        pending.push(el);
        io.observe(el);
      }
    }

    if (window.matchMedia("(hover: hover)").matches) {
      for (const tile of document.querySelectorAll<HTMLElement>("[data-tilt]")) {
        tile.addEventListener(
          "pointermove",
          (e) => {
            const box = tile.getBoundingClientRect();
            tile.style.setProperty("--ry", `${((e.clientX - box.left) / box.width - 0.5) * 16}deg`);
            tile.style.setProperty("--rx", `${(0.5 - (e.clientY - box.top) / box.height) * 12}deg`);
          },
          { signal: listeners.signal, passive: true },
        );
        tile.addEventListener(
          "pointerleave",
          () => {
            tile.style.removeProperty("--rx");
            tile.style.removeProperty("--ry");
          },
          { signal: listeners.signal },
        );
      }
    }

    return () => {
      listeners.abort();
      observer?.disconnect();
      // Never leave an element hidden with nothing watching it.
      for (const el of pending) el.dataset.reveal = "in";
    };
  }, []);

  return null;
}
