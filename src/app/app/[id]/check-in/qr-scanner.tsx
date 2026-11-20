"use client";

import { useEffect, useRef, useState } from "react";

import { parsePassUrl } from "@/lib/pass";

// Not in TypeScript's DOM lib yet; only the part we use.
type DetectedBarcode = { rawValue: string };
type BarcodeDetectorLike = { detect(source: CanvasImageSource): Promise<DetectedBarcode[]> };
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

const SCAN_INTERVAL_MS = 250;
// The same pass held in view isn't reported again for this long.
const REPEAT_MS = 4000;

function detectorCtor(): BarcodeDetectorCtor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

/**
 * Camera QR scanner. Decodes with the browser's BarcodeDetector where it exists; otherwise says so and the host
 * can use the phone's own camera app (the pass URL opens the check-in page). Scanned text is only ever passed
 * through `parsePassUrl`; the page never navigates to it. The camera is released on stop/unmount.
 */
export function QrScanner({ onToken }: { onToken: (token: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onTokenRef = useRef(onToken);
  const [state, setState] = useState<"starting" | "scanning" | "unsupported" | "denied" | "error">(() =>
    typeof window !== "undefined" && detectorCtor() === null ? "unsupported" : "starting",
  );

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    const Detector = detectorCtor();
    if (!Detector || !navigator.mediaDevices?.getUserMedia) return;

    const video = videoRef.current;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = { token: "", at: 0 };
    const detector = new Detector({ formats: ["qr_code"] });

    async function tick(video: HTMLVideoElement) {
      if (cancelled) return;
      if (video.readyState >= 2) {
        try {
          const codes = await detector.detect(video);
          for (const code of codes) {
            const token = parsePassUrl(code.rawValue);
            if (token && !(token === last.token && Date.now() - last.at < REPEAT_MS)) {
              last = { token, at: Date.now() };
              onTokenRef.current(token);
              break;
            }
          }
        } catch {
          // A failed frame is fine; try the next one.
        }
      }
      if (!cancelled) timer = setTimeout(() => void tick(video), SCAN_INTERVAL_MS);
    }

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled || !video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setState("scanning");
        void tick(video);
      } catch (err) {
        if (!cancelled) setState(err instanceof DOMException && err.name === "NotAllowedError" ? "denied" : "error");
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
    };
  }, []);

  if (state === "unsupported") {
    return (
      <p role="status" className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
        Scan the pass with your phone&rsquo;s camera app.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <video
        ref={videoRef}
        muted
        playsInline
        aria-label="Camera view for scanning entry passes"
        className="aspect-square w-full max-w-sm rounded-2xl bg-muted object-cover"
      />
      <p role="status" className="text-sm text-muted-foreground">
        {state === "starting" && "Starting the camera…"}
        {state === "scanning" && "Point the camera at a guest’s pass."}
        {state === "denied" && "Camera access is blocked. Allow it in your browser settings, or scan with your phone’s camera app."}
        {state === "error" && "Couldn’t start the camera. Scan the pass with your phone’s camera app instead."}
      </p>
    </div>
  );
}
