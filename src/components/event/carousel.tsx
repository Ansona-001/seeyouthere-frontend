"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Dependency-free carousel (build-out plan rich-blocks extension §1 decision
 * 7, §6.3). Two visual variants share one accessible shell:
 * - `"slide"`: a CSS scroll-snap track (photo galleries) — native swipe on
 *   touch devices, an `IntersectionObserver` on the track tracks the active
 *   slide.
 * - `"fade"`: all slides stacked in one grid cell, cross-faded with opacity
 *   (wishes) — no layout shift, since the container is as tall as the
 *   tallest slide.
 *
 * Follows the WAI-ARIA APG carousel pattern: `aria-roledescription="carousel"`
 * on the region, `role="group" aria-roledescription="slide"` per slide,
 * `aria-live` toggles between "off" (autoplaying) and "polite" (idle), and
 * ArrowLeft/ArrowRight on the focused region navigate. "Looping" past the
 * last slide rewinds to the first rather than seamlessly wrapping (accepted
 * trade-off — avoids cloning slides, which would duplicate `alt` text for
 * screen readers).
 *
 * Autoplay only ever runs when `interactive` is true (never in the editor
 * preview), `prefers-reduced-motion` is not set, the tab is visible, the
 * carousel is at least half in the viewport, and it isn't hovered/focused.
 * Any manual navigation stops autoplay for the rest of the session.
 */
export function Carousel({
  label,
  variant,
  autoplayMs,
  interactive,
  children,
}: {
  label: string;
  variant: "slide" | "fade";
  autoplayMs: number;
  interactive: boolean;
  children: ReactNode[];
}) {
  const count = children.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(interactive);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [manualStop, setManualStop] = useState(false);
  const regionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(true);
  const hoveredRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Reads a platform preference the server can't know; this is the
    // documented exception to react-hooks/set-state-in-effect (runs once
    // on mount, then only in response to the "change" event below — not a
    // reactive cascade).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Track whether the carousel is at least half in the viewport, for the
  // autoplay timer below. Tab visibility is read live (not cached) since an
  // intersection ratio rarely changes just because the tab regained focus.
  useEffect(() => {
    const region = regionRef.current;
    if (!region || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      inViewRef.current = entry.isIntersecting;
    }, { threshold: 0.5 });
    observer.observe(region);
    return () => observer.disconnect();
  }, []);

  const canAutoplay = interactive && !reducedMotion && count > 1 && !manualStop;

  // Autoplay timer.
  useEffect(() => {
    if (!canAutoplay || !playing) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible" || !inViewRef.current || hoveredRef.current) return;
      setIndex((i) => (i + 1 < count ? i + 1 : 0));
    }, autoplayMs);
    return () => clearInterval(id);
  }, [canAutoplay, playing, autoplayMs, count]);

  // Keep the "slide" track's scroll position in sync with `index` (both
  // programmatic navigation and native swipe update it — see the observer
  // below for the swipe -> index direction).
  useEffect(() => {
    if (variant !== "slide") return;
    const track = trackRef.current;
    if (!track) return;
    const target = index * track.clientWidth;
    if (Math.abs(track.scrollLeft - target) < 2) return;
    track.scrollTo({ left: target, behavior: reducedMotion ? "auto" : "smooth" });
  }, [index, variant, reducedMotion]);

  // Native swipe/scroll -> active index, for the "slide" variant.
  useEffect(() => {
    if (variant !== "slide") return;
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.children) as HTMLElement[];
    if (slides.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.6) {
            const i = slides.indexOf(entry.target as HTMLElement);
            if (i >= 0) setIndex(i);
          }
        }
      },
      { root: track, threshold: 0.6 },
    );
    for (const slide of slides) observer.observe(slide);
    return () => observer.disconnect();
  }, [variant, count]);

  if (count === 0) return null;
  if (count === 1) {
    return <div className="ev-carousel-single">{children[0]}</div>;
  }

  function goTo(i: number) {
    setManualStop(true);
    setPlaying(false);
    setIndex(((i % count) + count) % count);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1 < count ? index + 1 : 0);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1 >= 0 ? index - 1 : count - 1);
    }
  }

  function togglePlay() {
    setPlaying((p) => !p);
  }

  return (
    <section
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => (hoveredRef.current = true)}
      onMouseLeave={() => (hoveredRef.current = false)}
      onFocus={() => (hoveredRef.current = true)}
      onBlur={() => (hoveredRef.current = false)}
      onKeyDown={onKeyDown}
    >
      {variant === "slide" ? (
        <div
          ref={trackRef}
          className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-live={canAutoplay && playing ? "off" : "polite"}
        >
          {children.map((child, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              className="w-full shrink-0 snap-center"
            >
              {child}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid" aria-live={canAutoplay && playing ? "off" : "polite"}>
          {children.map((child, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              inert={i !== index ? true : undefined}
              className={cn(
                "[grid-area:1/1] motion-safe:transition-opacity motion-safe:duration-700",
                i === index ? "opacity-100" : "invisible opacity-0",
              )}
            >
              {child}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => goTo(index - 1 >= 0 ? index - 1 : count - 1)}
          className="flex size-9 items-center justify-center rounded-full text-(--ev-accent-ink) transition hover:bg-(--ev-accent)/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {count <= 10 ? (
          <div className="flex items-center gap-2">
            {children.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
                className={cn(
                  "size-2.5 rounded-full transition",
                  i === index ? "bg-(--ev-accent-ink)" : "bg-(--ev-accent-ink)/30",
                )}
              />
            ))}
          </div>
        ) : (
          <span className="text-xs tabular-nums text-(--ev-muted)">
            {index + 1} / {count}
          </span>
        )}

        <button
          type="button"
          aria-label="Next slide"
          onClick={() => goTo(index + 1 < count ? index + 1 : 0)}
          className="flex size-9 items-center justify-center rounded-full text-(--ev-accent-ink) transition hover:bg-(--ev-accent)/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {canAutoplay && (
          <button
            type="button"
            aria-label={playing ? "Pause automatic slideshow" : "Play automatic slideshow"}
            onClick={togglePlay}
            className="flex size-9 items-center justify-center rounded-full text-(--ev-accent-ink) transition hover:bg-(--ev-accent)/10"
          >
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 5v14l12-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
