"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const ARROW =
  "absolute top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-card text-brand-heading shadow-md ring-1 ring-foreground/10 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * A horizontally scrolling row of `<li>`s with round arrow buttons that appear on whichever side has more to show,
 * and a soft fade on that edge. The row stays scrollable by touch, wheel and keyboard; the arrows are a pointer
 * convenience, so they're hidden from assistive tech (the links themselves are all reachable by Tab).
 */
export function ScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [more, setMore] = useState({ left: false, right: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function update() {
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      // 1px of slack: scrollLeft is fractional on zoomed or scaled displays.
      setMore({ left: el.scrollLeft > 1, right: el.scrollLeft < max - 1 });
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function scrollBy(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="relative">
      <ul
        ref={ref}
        className={cn(
          "flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          more.left && more.right && "[mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]",
          more.left && !more.right && "[mask-image:linear-gradient(to_right,transparent,black_3rem)]",
          !more.left && more.right && "[mask-image:linear-gradient(to_right,black_calc(100%-3rem),transparent)]",
          className,
        )}
      >
        {children}
      </ul>
      {more.left && (
        <button type="button" aria-hidden tabIndex={-1} onClick={() => scrollBy(-1)} className={cn(ARROW, "left-0")}>
          <ChevronLeft className="size-5" />
        </button>
      )}
      {more.right && (
        <button type="button" aria-hidden tabIndex={-1} onClick={() => scrollBy(1)} className={cn(ARROW, "right-0")}>
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  );
}
