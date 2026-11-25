"use client";

import { NativeSelect } from "@/components/ui/native-select";
import type { Region } from "@/lib/api-types";
import { REGION_LABELS } from "@/lib/premium";
import { useRegion } from "@/lib/use-region";

const REGIONS = Object.keys(REGION_LABELS) as Region[];

/** "Prices for [India ▾]": the viewer's pricing region, remembered and shared by every price on the page. */
export function RegionSelect({ className }: { className?: string }) {
  const [region, setRegion] = useRegion();
  return (
    <label className={className ?? "flex items-center gap-2 text-sm text-muted-foreground"}>
      Prices for
      <NativeSelect value={region} onChange={(e) => setRegion(e.target.value as Region)} className="h-10 w-auto rounded-full pr-3 pl-4 text-sm">
        {REGIONS.map((r) => (
          <option key={r} value={r}>
            {REGION_LABELS[r]}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
