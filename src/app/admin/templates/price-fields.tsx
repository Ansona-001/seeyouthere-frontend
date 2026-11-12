import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PriceInputs = { inr: string; aed: string; usd: string };

/** India price (required) plus optional AED and USD prices, whole units each. Blank AED/USD = region not offered. */
export function PriceFields({
  idPrefix,
  values,
  invalid,
  onChange,
}: {
  idPrefix: string;
  values: PriceInputs;
  invalid: Record<keyof PriceInputs, boolean>;
  onChange: (key: keyof PriceInputs, value: string) => void;
}) {
  const fields: { key: keyof PriceInputs; label: string; required: boolean }[] = [
    { key: "inr", label: "India price (₹, whole rupees)", required: true },
    { key: "aed", label: "UAE price (AED, whole dirhams)", required: false },
    { key: "usd", label: "Rest of world price ($, whole dollars)", required: false },
  ];
  return (
    <div className="grid gap-3">
      {fields.map((f) => (
        <div key={f.key} className="grid gap-2">
          <Label htmlFor={`${idPrefix}-${f.key}`}>{f.label}</Label>
          <Input
            id={`${idPrefix}-${f.key}`}
            value={values[f.key]}
            onChange={(e) => onChange(f.key, e.target.value)}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            required={f.required}
            aria-invalid={invalid[f.key]}
            aria-describedby={`${idPrefix}-help`}
            className="max-w-32"
          />
        </div>
      ))}
      <p id={`${idPrefix}-help`} className="text-sm text-muted-foreground">
        Whole numbers from 1 to 10000. Leave AED or $ blank to not offer that region. Live events keep this design; they need an unlock to re-publish.
      </p>
    </div>
  );
}
