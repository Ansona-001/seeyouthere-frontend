"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { Theme } from "@/lib/api-types";

import { themeStyle } from "./theme";
import { foilGradient } from "./theme-engine/foil";
import { INTROS, type IntroKey } from "./theme-engine/intros";
import { textureUrl } from "./theme-engine/textures";

/** Longest the cover waits for fonts and images before it shows "Tap to open"; a slow connection never traps the page. */
const MAX_WAIT_MS = 4000;
/** How many above-the-fold images of the page behind are waited for. */
const MAX_IMAGES = 12;
/** A tap waits at most this long for the page behind to be ready, then opens anyway. */
const OPEN_WAIT_MS = 1200;
/** Matches the CSS opening: bow fade, then the panels slide apart. */
const OPEN_MS = 1300;

function settled(img: HTMLImageElement) {
  return img.complete ? Promise.resolve() : img.decode().catch(() => undefined);
}

/**
 * Full-screen closed card for themes whose `intro` is set: two paper panels on a foil seam, a satin bow across it
 * and a "Tap to open" hint. A tap fades the bow and slides the panels apart over the page, which is already laid out
 * behind it (inert until then). The same tap unlocks the theme music.
 *
 * Progressive enhancement like `LoadGate`: it is part of the server HTML, hides itself with CSS after a few seconds
 * if scripts never run (and with `noscript`, and under `prefers-reduced-motion`). It sits outside the theme root,
 * which is a size container, so its theme variables are applied on its own root.
 */
export function IntroCover({ intro, theme }: { intro: IntroKey; theme: Theme }) {
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const ready = useRef<Promise<void> | null>(null);
  const opened = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [gone, setGone] = useState(false);
  const art = INTROS[intro];

  useEffect(() => {
    const el = ref.current;
    // A tap handled before this effect already opened the card: never lock the page behind it afterwards.
    if (!el || opened.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || getComputedStyle(el).visibility === "hidden") {
      setGone(true);
      return;
    }
    let cancelled = false;
    const pending = timers.current;
    const root = document.querySelector<HTMLElement>("[data-ev-theme]");
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;

    el.setAttribute("data-js", "");
    root?.setAttribute("inert", "");
    html.style.overflow = "hidden";

    const own = Array.from(el.querySelectorAll("img"));
    const page = root ? Array.from(root.querySelectorAll("img")).filter((img) => img.loading !== "lazy").slice(0, MAX_IMAGES) : [];
    const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
    const all = Promise.all([fonts, ...own.map(settled), ...page.map(settled)]).then(() => undefined);
    ready.current = all;
    const timeout = new Promise<void>((resolve) => pending.push(setTimeout(resolve, MAX_WAIT_MS)));
    void Promise.race([all, timeout]).then(() => {
      if (cancelled) return;
      el.setAttribute("data-ready", "");
      button.current?.focus({ preventScroll: true });
    });

    return () => {
      cancelled = true;
      pending.forEach(clearTimeout);
      pending.length = 0;
      root?.removeAttribute("inert");
      html.style.overflow = previousOverflow;
    };
  }, []);

  function open() {
    if (opened.current) return;
    opened.current = true;
    const el = ref.current;
    const pending = timers.current;
    const wait = new Promise<void>((resolve) => pending.push(setTimeout(resolve, OPEN_WAIT_MS)));
    void Promise.race([ready.current ?? Promise.resolve(), wait]).then(() => {
      if (!el?.isConnected) return;
      const root = document.querySelector<HTMLElement>("[data-ev-theme]");
      el.setAttribute("data-open", "");
      root?.removeAttribute("inert");
      root?.setAttribute("data-ev-intro-open", "");
      document.documentElement.style.overflow = "";
      pending.push(
        setTimeout(() => {
          const h1 = document.querySelector<HTMLElement>("[data-ev-theme] h1");
          if (h1) {
            h1.tabIndex = -1;
            h1.focus({ preventScroll: true });
          }
          setGone(true);
        }, OPEN_MS),
      );
    });
  }

  if (gone) return null;

  const style = {
    ...themeStyle(theme),
    "--intro-foil": foilGradient(theme.foil) ?? "var(--ev-accent-ink)",
    "--intro-paper": textureUrl("cold_press") ?? "none",
  } as CSSProperties;

  return (
    <>
      <noscript>
        <style>{".ev-intro{display:none!important}"}</style>
      </noscript>
      <div ref={ref} className="ev-intro" data-state="idle" style={style} role="dialog" aria-modal="true" aria-label="Your invitation">
        <div className="ev-intro-panel ev-intro-panel-l" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- constant decorative artwork, sized by CSS */}
          <img className="ev-intro-strand" src={art.strand.src} width={art.strand.width} height={art.strand.height} alt="" loading="eager" decoding="async" />
        </div>
        <div className="ev-intro-panel ev-intro-panel-r" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- constant decorative artwork, sized by CSS */}
          <img className="ev-intro-strand ev-intro-strand-r" src={art.strand.src} width={art.strand.width} height={art.strand.height} alt="" loading="eager" decoding="async" />
        </div>
        <span className="ev-intro-seam" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element -- constant decorative artwork, sized by CSS */}
        <img className="ev-intro-bow" src={art.bow.src} width={art.bow.width} height={art.bow.height} alt="" fetchPriority="high" loading="eager" />
        <button ref={button} type="button" className="ev-intro-tap" onClick={open}>
          <span className="ev-intro-hint">
            Tap to open<span className="sr-only"> the invitation</span>
          </span>
        </button>
      </div>
    </>
  );
}
