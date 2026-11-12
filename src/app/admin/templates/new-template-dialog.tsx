"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api, ApiError, type AdminTemplate } from "@/lib/api";
import { rupeesToPaise, wholeUnitsToMinor } from "@/lib/premium";

import { PriceFields, type PriceInputs } from "./price-fields";

export function NewTemplateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [prices, setPrices] = useState<PriceInputs>({ inr: "599", aed: "", usd: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const pricePaise = rupeesToPaise(prices.inr);
    const aed = wholeUnitsToMinor(prices.aed);
    const usd = wholeUnitsToMinor(prices.usd);
    if (isPremium && (pricePaise === null || aed === undefined || usd === undefined)) {
      setError("Enter whole-number prices from 1 to 10000; leave AED or $ blank to not offer that region.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const created = await api<AdminTemplate>("/v1/admin/templates", {
        method: "POST",
        json: { slug, name, tags: {}, is_premium: isPremium, ...(isPremium && { price_paise: pricePaise, regional_prices: { AE: aed, INT: usd } }) },
      });
      setOpen(false);
      router.push(`/admin/templates/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New template</DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Name</Label>
              <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-slug">Slug</Label>
              <Input
                id="template-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                pattern="[a-z0-9-]+"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="template-premium" checked={isPremium} onCheckedChange={setIsPremium} />
              <Label htmlFor="template-premium">Premium (hosts unlock it per event)</Label>
            </div>
            {isPremium && (
              <PriceFields
                idPrefix="template-price"
                values={prices}
                invalid={{
                  inr: rupeesToPaise(prices.inr) === null,
                  aed: wholeUnitsToMinor(prices.aed) === undefined,
                  usd: wholeUnitsToMinor(prices.usd) === undefined,
                }}
                onChange={(key, value) => setPrices((p) => ({ ...p, [key]: value }))}
              />
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
