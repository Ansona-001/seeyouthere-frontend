"use client";

import { useEffect, useState } from "react";

import { EvCard } from "./surface";

function diffParts(targetMs: number, nowMs: number) {
  const totalSeconds = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: totalSeconds <= 0,
  };
}

/**
 * Four-cell "glass grid" countdown (build-out plan rich-blocks extension
 * §4.3, §6.2): each unit in an `EvCard` (a no-op under `surface: "plain"`),
 * numerals in `--ev-accent-ink`. Always one row: the cells, numerals and
 * labels scale with the page width so four units fit even on a phone. Ticks once a second; under
 * `prefers-reduced-motion` the count is computed once and never ticks, and
 * the seconds cell is dropped (today's cadence) so nothing visibly moves.
 */
export function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  // Renders nothing until mounted so the server-rendered markup never shows a
  // stale (or hydration-mismatched) count.
  const [now, setNow] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Both reads a platform preference and sets "now" the server can't know
    // — this runs once on mount (not a reactive cascade), so it's the
    // documented exception to react-hooks/set-state-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(mq.matches);
    setNow(Date.now());
    if (mq.matches) return;
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, []);

  if (now === null || Number.isNaN(targetMs)) return null;

  const { days, hours, minutes, seconds, done } = diffParts(targetMs, now);
  if (done) {
    return <p className="text-lg font-medium text-(--ev-accent-ink)">It&apos;s today!</p>;
  }

  const cells: [string, number][] = reducedMotion
    ? [["Days", days], ["Hours", hours], ["Minutes", minutes]]
    : [["Days", days], ["Hours", hours], ["Minutes", minutes], ["Seconds", seconds]];

  return (
    <div
      role="timer"
      aria-live="off"
      className={
        reducedMotion
          ? "grid w-full max-w-md grid-cols-3 gap-3"
          : "grid w-full max-w-xl grid-cols-4 gap-2 @min-[640px]/ev:gap-4"
      }
    >
      {cells.map(([label, value]) => (
        <EvCard key={label} className="flex min-w-0 flex-col items-center gap-1 px-1! py-3!">
          <span className="text-(--ev-accent-ink) tabular-nums [font-family:var(--ev-font-heading)] text-[clamp(1.5rem,7cqi,3.5rem)] leading-none">
            {value}
          </span>
          <span className="text-[clamp(9px,2.6cqi,12px)] tracking-wide text-(--ev-muted) uppercase">{label}</span>
        </EvCard>
      ))}
    </div>
  );
}
