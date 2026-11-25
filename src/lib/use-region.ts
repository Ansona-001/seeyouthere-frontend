import { useSyncExternalStore } from "react";

import type { Region } from "./api-types";
import { preferredRegion, rememberRegion } from "./premium";

// The region prices are shown in. The server and the first client render use India (the always-offered price),
// then the viewer's remembered or time-zone-detected region takes over without a hydration mismatch.
let override: Region | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

const getSnapshot = (): Region => override ?? preferredRegion() ?? "IN";
const getServerSnapshot = (): Region => "IN";

/** The viewer's pricing region and a setter that remembers the choice (also when storage is blocked). */
export function useRegion(): [Region, (region: Region) => void] {
  const region = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setRegion = (next: Region) => {
    override = next;
    rememberRegion(next);
    listeners.forEach((notify) => notify());
  };
  return [region, setRegion];
}
