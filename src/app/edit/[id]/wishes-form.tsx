"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Wish, WishesBlock } from "@/lib/api-types";

import { Field, KickerField } from "./block-form";

const MAX_WISHES = 30;

/**
 * Editor form for the `wishes` block (build-out plan rich-blocks §6.7).
 * Host-curated only — there is no public write endpoint for this block
 * type, so every item is entered here.
 */
export function WishesForm({ block, onChange }: { block: WishesBlock; onChange: (patch: Partial<WishesBlock>) => void }) {
  function updateItem(index: number, patch: Partial<Wish>) {
    onChange({ items: block.items.map((it, i) => (i === index ? { ...it, ...patch } : it)) });
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= block.items.length) return;
    const next = [...block.items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ items: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <KickerField idPrefix="wishes" value={block.kicker} onChange={(kicker) => onChange({ kicker })} />
      <Field label="Heading" htmlFor="wishes-heading">
        <Input id="wishes-heading" maxLength={120} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} />
      </Field>

      <div className="flex flex-col gap-3">
        {block.items.map((item, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-input bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Wish {i + 1}</p>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ChevronUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Move down"
                  disabled={i === block.items.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDownIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove this wish"
                  disabled={block.items.length <= 1}
                  onClick={() => onChange({ items: block.items.filter((_, idx) => idx !== i) })}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <Field label="Message" htmlFor={`wishes-${i}-message`}>
              <Textarea
                id={`wishes-${i}-message`}
                required
                maxLength={500}
                rows={3}
                value={item.message}
                onChange={(e) => updateItem(i, { message: e.target.value })}
              />
            </Field>
            <Field label="Author" htmlFor={`wishes-${i}-author`}>
              <Input
                id={`wishes-${i}-author`}
                required
                maxLength={80}
                value={item.author}
                onChange={(e) => updateItem(i, { author: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={block.items.length >= MAX_WISHES}
        onClick={() => onChange({ items: [...block.items, { message: "", author: "" }] })}
      >
        <PlusIcon data-icon="inline-start" />
        Add wish
      </Button>
    </div>
  );
}
