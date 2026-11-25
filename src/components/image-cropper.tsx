"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";

import { downscaleToJpeg } from "@/components/event/photo-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clampOffset,
  clampZoom,
  coverScale,
  cropRect,
  fitFrame,
  MAX_ZOOM,
  zoomAbout,
  type Point,
  type Size,
} from "@/lib/crop";
import { cn } from "cn";

/** Ratios offered when the caller doesn't fix one. "Original" keeps the picture's own shape (within 1:2 to 2:1). */
const ASPECT_CHOICES = [
  { key: "original", label: "Original", aspect: null },
  { key: "square", label: "Square", aspect: 1 },
  { key: "portrait", label: "4:5", aspect: 4 / 5 },
  { key: "wide", label: "16:9", aspect: 16 / 9 },
] as const;

const STAGE_MARGIN = 20;
/** Rule-of-thirds guide lines, drawn inside a rectangular frame. */
const THIRDS =
  "linear-gradient(to right, transparent calc(33.33% - 0.5px), rgb(255 255 255 / 0.45) 0 calc(33.33% + 0.5px), transparent 0 calc(66.66% - 0.5px), rgb(255 255 255 / 0.45) 0 calc(66.66% + 0.5px), transparent 0), linear-gradient(to bottom, transparent calc(33.33% - 0.5px), rgb(255 255 255 / 0.45) 0 calc(33.33% + 0.5px), transparent 0 calc(66.66% - 0.5px), rgb(255 255 255 / 0.45) 0 calc(66.66% + 0.5px), transparent 0)";
const KEY_STEP = 12;
const ZOOM_STEP = 0.1;

type View = { zoom: number; offset: Point };

/**
 * A WhatsApp/Instagram-style crop step shown after a photo is picked and before it is uploaded: drag to move, pinch,
 * wheel or slider to zoom, arrow keys and +/- from the keyboard. The picture always covers the frame. Confirming
 * hands back a JPEG of just the framed part (metadata dropped, long edge capped, like every other upload).
 *
 * `aspect` fixes the frame's width / height; leave it out to let the host choose among a few ratios. `round` shows a
 * circular mask over the frame for pictures the invitation draws as a circle (the saved picture is still a rectangle).
 */
export function ImageCropper({
  file,
  aspect,
  round = false,
  title = "Adjust your photo",
  onConfirm,
  onCancel,
}: {
  file: File;
  aspect?: number;
  round?: boolean;
  title?: string;
  onConfirm: (blob: Blob) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [natural, setNatural] = useState<Size | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [choice, setChoice] = useState<(typeof ASPECT_CHOICES)[number]["key"]>("original");
  const [view, setView] = useState<View>({ zoom: 1, offset: { x: 0, y: 0 } });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // As large as the dialog allows, so a phone has plenty of picture under the fingers.
  const [box] = useState(() => ({
    w: Math.max(160, Math.min(360, window.innerWidth - 64)),
    h: Math.max(160, Math.min(440, Math.round(window.innerHeight * 0.6))),
  }));
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ dist: number; view: View; focal: Point } | null>(null);

  // The picture's object URL lives only as long as the <img>; revoking it frees the decoded picture. A ref callback
  // (not an effect) because the dialog mounts its content after this component renders, and the URL is set on the
  // element directly so a development remount recreates it cleanly. `file` is its only input, so the callback is stable.
  const showFile = useCallback(
    (img: HTMLImageElement | null) => {
      if (!img) return;
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      return () => {
        img.removeAttribute("src");
        URL.revokeObjectURL(objectUrl);
      };
    },
    [file],
  );

  const ratio = aspect ?? ASPECT_CHOICES.find((c) => c.key === choice)?.aspect ?? (natural ? natural.w / natural.h : 1);
  // The frame sits inside a larger stage, so the rest of the picture stays visible around it.
  const frame = fitFrame(Math.min(2, Math.max(0.5, ratio)), box.w - STAGE_MARGIN * 2, box.h - STAGE_MARGIN * 2);
  const scale = natural ? coverScale(natural, frame) * view.zoom : 1;

  // Dims and blurs everything but the frame: a circular hole for round crops, a rectangular one otherwise.
  const hole = { x: (box.w - frame.w) / 2, y: (box.h - frame.h) / 2 };
  const outside: CSSProperties = round
    ? {
        maskImage: `radial-gradient(circle at 50% 50%, transparent ${frame.w / 2}px, #000 ${frame.w / 2 + 1}px)`,
        WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent ${frame.w / 2}px, #000 ${frame.w / 2 + 1}px)`,
      }
    : {
        // Two layers, the whole stage minus the frame's rectangle (exclusive-or), so the frame stays clear.
        maskImage: "linear-gradient(#000, #000), linear-gradient(#000, #000)",
        WebkitMaskImage: "linear-gradient(#000, #000), linear-gradient(#000, #000)",
        maskSize: `100% 100%, ${frame.w}px ${frame.h}px`,
        WebkitMaskSize: `100% 100%, ${frame.w}px ${frame.h}px`,
        maskPosition: `0 0, ${hole.x}px ${hole.y}px`,
        WebkitMaskPosition: `0 0, ${hole.x}px ${hole.y}px`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskComposite: "exclude",
        WebkitMaskComposite: "xor",
      };

  function update(next: (v: View) => View) {
    setView((v) => {
      const n = next(v);
      const zoom = clampZoom(n.zoom);
      return natural ? { zoom, offset: clampOffset(n.offset, natural, frame, zoom) } : { zoom, offset: n.offset };
    });
  }

  function pickChoice(key: (typeof ASPECT_CHOICES)[number]["key"]) {
    setChoice(key);
    setView({ zoom: 1, offset: { x: 0, y: 0 } });
  }

  /** A point in client coordinates relative to the frame's centre. */
  function fromCentre(el: HTMLElement, x: number, y: number): Point {
    const r = el.getBoundingClientRect();
    return { x: x - (r.left + r.width / 2), y: y - (r.top + r.height / 2) };
  }

  function midpoint(): { mid: Point; dist: number } {
    const [a, b] = [...pointers.current.values()];
    return { mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, dist: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const { mid, dist } = midpoint();
      pinch.current = { dist, view, focal: fromCentre(e.currentTarget, mid.x, mid.y) };
    }
  }

  // One finger drags; two fingers pinch, zooming about the midpoint between them and following it as it moves.
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);
    if (pointers.current.size === 2 && pinch.current) {
      const start = pinch.current;
      const { mid, dist } = midpoint();
      const zoom = clampZoom(start.view.zoom * (dist / start.dist));
      const moved = zoomAbout(start.view, zoom, start.focal);
      const now = fromCentre(e.currentTarget, mid.x, mid.y);
      update(() => ({
        zoom,
        offset: { x: moved.offset.x + now.x - start.focal.x, y: moved.offset.y + now.y - start.focal.y },
      }));
    } else if (pointers.current.size === 1) {
      update((v) => ({ ...v, offset: { x: v.offset.x + cur.x - prev.x, y: v.offset.y + cur.y - prev.y } }));
    }
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  }

  // Mouse wheel (and trackpad pinch) zooms about the cursor.
  function onWheel(e: WheelEvent<HTMLDivElement>) {
    const focal = fromCentre(e.currentTarget, e.clientX, e.clientY);
    const factor = Math.exp(-e.deltaY * 0.002);
    update((v) => zoomAbout(v, clampZoom(v.zoom * factor), focal));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -KEY_STEP, y: 0 },
      ArrowRight: { x: KEY_STEP, y: 0 },
      ArrowUp: { x: 0, y: -KEY_STEP },
      ArrowDown: { x: 0, y: KEY_STEP },
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      update((v) => ({
        ...v,
        offset: { x: v.offset.x + move.x, y: v.offset.y + move.y },
      }));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      update((v) => ({ ...v, zoom: v.zoom + ZOOM_STEP }));
    } else if (e.key === "-") {
      e.preventDefault();
      update((v) => ({ ...v, zoom: v.zoom - ZOOM_STEP }));
    }
  }

  async function confirm() {
    if (!natural || pending) return;
    setPending(true);
    setError(null);
    try {
      const blob = await downscaleToJpeg(file, {
        crop: cropRect(natural, frame, view.zoom, view.offset),
      });
      await onConfirm(blob);
    } catch {
      setError("Couldn't process that image. Please try another one.");
      setPending(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onCancel()}>
      <DialogContent className="gap-3 p-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            <span className="[@media(pointer:coarse)]:hidden">Drag to move and use the slider or scroll to zoom.</span>
            <span className="hidden [@media(pointer:coarse)]:inline">Drag to move and pinch to zoom.</span> The bright
            area is what gets used.
          </DialogDescription>
        </DialogHeader>

        {loadFailed ? (
          <p role="alert" className="text-sm text-destructive">
            We can&rsquo;t open that file as a picture. Try a JPEG, PNG or WebP photo. On an iPhone, choose &ldquo;Most
            Compatible&rdquo; for the format.
          </p>
        ) : (
          <>
            <div
              role="group"
              tabIndex={0}
              aria-label="Photo crop area. Arrow keys move the photo; plus and minus zoom."
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onKeyDown={onKeyDown}
              onWheel={onWheel}
              style={{ width: box.w, height: box.h, touchAction: "none" }}
              className="relative mx-auto max-w-full cursor-grab touch-none overflow-hidden rounded-xl bg-muted outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a local object URL: next/image can't optimise it */}
              <img
                ref={showFile}
                alt=""
                draggable={false}
                onLoad={(e) =>
                  setNatural({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  })
                }
                onError={() => setLoadFailed(true)}
                style={
                  natural
                    ? {
                        position: "absolute",
                        left: box.w / 2 + view.offset.x - (natural.w * scale) / 2,
                        top: box.h / 2 + view.offset.y - (natural.h * scale) / 2,
                        width: natural.w * scale,
                        height: natural.h * scale,
                        maxWidth: "none",
                      }
                    : { visibility: "hidden", position: "absolute" }
                }
              />
              {/* Outside the frame the picture is dimmed and blurred: only the framed part is used. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-black/45 backdrop-blur-[6px]"
                style={outside}
              />
              {/* The frame: an outline round the part that is kept, with thirds guides on a rectangle. */}
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute border-2 border-white/90",
                  round ? "rounded-full" : "bg-(image:--thirds)",
                )}
                style={{
                  left: (box.w - frame.w) / 2,
                  top: (box.h - frame.h) / 2,
                  width: frame.w,
                  height: frame.h,
                  ["--thirds" as string]: THIRDS,
                }}
              />
            </div>

            {aspect === undefined && (
              <div role="group" aria-label="Shape" className="flex flex-wrap justify-center gap-1.5">
                {ASPECT_CHOICES.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    aria-pressed={choice === c.key}
                    onClick={() => pickChoice(c.key)}
                    className={cn(
                      "inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      choice === c.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/70",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 [@media(pointer:coarse)]:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom out"
                onClick={() => update((v) => ({ ...v, zoom: v.zoom - ZOOM_STEP * 3 }))}
              >
                <MinusIcon />
              </Button>
              <input
                type="range"
                aria-label="Zoom"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={view.zoom}
                onChange={(e) => update((v) => ({ ...v, zoom: Number(e.target.value) }))}
                className="h-11 min-w-0 flex-1 accent-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Zoom in"
                onClick={() => update((v) => ({ ...v, zoom: v.zoom + ZOOM_STEP * 3 }))}
              >
                <PlusIcon />
              </Button>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="flex-row justify-end gap-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={pending || !natural || loadFailed} onClick={confirm}>
            {pending ? "Uploading…" : "Use photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
