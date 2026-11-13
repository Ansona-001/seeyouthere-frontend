"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

const DRIFT_PX_PER_SEC = 28;
const RESUME_AFTER_MS = 2500;
// Movement under this many px is a tap, not a drag, so the card link still opens.
const DRAG_THRESHOLD_PX = 6;
// Cards moved per arrow press.
const STEP_CARDS = 2;
const COPIES = 3;

/**
 * Endless row of cards that drifts slowly on its own. Drag it, or use the arrows, to go either way;
 * it pauses while hovered, focused or being dragged and resumes a moment later. The row is repeated
 * so the position can wrap invisibly; the repeats are hidden from assistive tech and the tab order.
 * With reduced motion it never drifts on its own (dragging and the arrows still work, without easing).
 * Position lives in a ref and is written straight to `transform`, so nothing re-renders per frame.
 */
export function OccasionStrip({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const motion = useRef({
    pos: 0,
    target: null as number | null,
    hover: false,
    focus: false,
    dragging: false,
    captured: false,
    lastX: 0,
    moved: 0,
    resumeAt: 0,
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const m = motion.current;
    let raf = 0;
    let last = 0;
    let cycle = 0;

    function measure() {
      if (track) cycle = track.scrollWidth / COPIES;
    }

    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (m.target !== null) {
        const diff = m.target - m.pos;
        if (reduce.matches || Math.abs(diff) < 0.5) {
          m.pos = m.target;
          m.target = null;
        } else {
          m.pos += diff * Math.min(1, dt * 8);
        }
      } else if (!reduce.matches && !m.hover && !m.focus && !m.dragging && now >= m.resumeAt) {
        m.pos += DRIFT_PX_PER_SEC * dt;
      }
      if (cycle > 0 && track) {
        const offset = ((m.pos % cycle) + cycle) % cycle;
        track.style.transform = `translate3d(${-offset}px,0,0)`;
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    // Don't animate while scrolled out of view.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    io.observe(track);
    return () => {
      stop();
      resize.disconnect();
      io.disconnect();
    };
  }, []);

  function step(direction: -1 | 1) {
    const track = trackRef.current;
    const items = track?.querySelectorAll("li");
    if (!items || items.length < 2) return;
    const card = items[1].offsetLeft - items[0].offsetLeft;
    const m = motion.current;
    m.target = (m.target ?? m.pos) + direction * card * STEP_CARDS;
    m.resumeAt = performance.now() + RESUME_AFTER_MS;
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Occasions"
      className="relative mt-8"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") step(-1);
        else if (e.key === "ArrowRight") step(1);
      }}
      onFocus={() => {
        motion.current.focus = true;
      }}
      onBlur={() => {
        motion.current.focus = false;
        motion.current.resumeAt = performance.now() + RESUME_AFTER_MS;
      }}
    >
      <div
        className="cursor-grab touch-pan-y overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] select-none active:cursor-grabbing"
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") motion.current.hover = true;
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") {
            motion.current.hover = false;
            motion.current.resumeAt = performance.now() + RESUME_AFTER_MS;
          }
        }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          const m = motion.current;
          m.dragging = true;
          m.captured = false;
          m.moved = 0;
          m.lastX = e.clientX;
          m.target = null;
        }}
        onPointerMove={(e) => {
          const m = motion.current;
          if (!m.dragging) return;
          const dx = e.clientX - m.lastX;
          m.lastX = e.clientX;
          m.moved += Math.abs(dx);
          // Only capture once it is really a drag; capturing earlier would swallow plain taps on a card.
          if (!m.captured && m.moved > DRAG_THRESHOLD_PX) {
            m.captured = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          if (m.captured) m.pos -= dx;
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          // A drag that ended on a card must not open it.
          if (motion.current.moved > DRAG_THRESHOLD_PX) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <div ref={trackRef} className="flex w-max will-change-transform">
          {Array.from({ length: COPIES }, (_, copy) => (
            <div key={copy} {...(copy > 0 ? { "aria-hidden": true, inert: true } : {})}>
              {children}
            </div>
          ))}
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Previous occasions"
        className="absolute top-[38%] left-2 -translate-y-1/2 rounded-full bg-card shadow-md sm:left-4"
        onClick={() => step(-1)}
      >
        <ChevronLeftIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Next occasions"
        className="absolute top-[38%] right-2 -translate-y-1/2 rounded-full bg-card shadow-md sm:right-4"
        onClick={() => step(1)}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );

  function endDrag() {
    const m = motion.current;
    m.dragging = false;
    m.resumeAt = performance.now() + RESUME_AFTER_MS;
  }
}
