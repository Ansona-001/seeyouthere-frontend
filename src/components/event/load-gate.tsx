"use client";

import { useEffect, useRef, useState } from "react";

/** Longest the cover waits for the first-screen images and fonts; a slow connection never traps the page. */
const MAX_WAIT_MS = 4000;
/** How many above-the-fold images are waited for, so a long page can't hold the cover. */
const MAX_IMAGES = 12;
/** Matches the CSS fade (`.ev-loader`), after which the cover is removed from the page. */
const FADE_MS = 600;

/**
 * Full-screen cover shown while the public invitation's first screen loads: it carries the theme's page colour
 * and a small ornament in its accent, so there is no flash of half-drawn sections. It lifts once the fonts and
 * the images that are not lazy-loaded (the hero art and photos) are decoded, or after `MAX_WAIT_MS`, so the hero
 * and every section appear together.
 *
 * Progressive enhancement: the cover is part of the server HTML, hides itself with CSS after a few seconds if
 * scripts never run, and is not rendered at all without JS (`noscript`). It sits outside the theme root because
 * that root is a size container, which would make a fixed overlay cover the whole page height, not the screen.
 */
export function LoadGate({ background, ink }: { background: string; ink: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let removeTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = () => {
      if (cancelled) return;
      el.setAttribute("data-done", "");
      removeTimer = setTimeout(() => setGone(true), FADE_MS);
    };

    const root = document.querySelector("[data-ev-theme]");
    const images = root ? Array.from(root.querySelectorAll("img")).filter((img) => img.loading !== "lazy").slice(0, MAX_IMAGES) : [];
    const decoded = images.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined)));
    const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, MAX_WAIT_MS));

    void Promise.race([Promise.all([fonts, ...decoded]), timeout]).then(finish);

    return () => {
      cancelled = true;
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <>
      <noscript>
        <style>{".ev-loader{display:none!important}"}</style>
      </noscript>
      <div
        ref={ref}
        className="ev-loader"
        style={{ backgroundColor: background, color: ink }}
        role="status"
        aria-live="polite"
        aria-label="Loading the invitation"
      >
        <span className="ev-loader-mark" aria-hidden="true">
          <span className="ev-loader-line" />
          <span className="ev-loader-dot" />
          <span className="ev-loader-line" />
        </span>
      </div>
    </>
  );
}
