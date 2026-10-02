"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Fade + rise-in reveal for the public page's block sections (build-out plan
 * rich-blocks extension §6.6). Layout-level: one `IntersectionObserver` for
 * the whole page, not one per block. Content is fully visible without JS —
 * `BlockSection` only gets the CSS that hides it once this effect sets
 * `data-reveal="on"` on the container, so no-JS, reduced-motion, and SEO/OG
 * scrapers all see everything immediately.
 *
 * `enabled` is false in the editor preview (no `[data-ev-reveal]` sections
 * there anyway) and true only on the live public page.
 */
export function ScrollReveal({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!enabled || !container || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-ev-reveal]")).slice(0, 40);
    const toObserve: HTMLElement[] = [];
    for (const el of sections) {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.setAttribute("data-revealed", "");
      } else {
        toObserve.push(el);
      }
    }

    container.setAttribute("data-reveal", "on");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    );
    for (const el of toObserve) observer.observe(el);

    return () => observer.disconnect();
  }, [enabled]);

  return <div ref={ref}>{children}</div>;
}
