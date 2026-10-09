"use client";

import { ChevronDownIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { Block, BlockType } from "@/lib/api-types";

import { BLOCK_LABELS, BLOCK_TYPES, canAddBlock } from "./blocks";

/**
 * Block list with add/remove/reorder controls (build-out plan §11.4).
 * Keyboard accessible by design: every action is a real `<button>`, moved
 * with dedicated up/down controls rather than drag-and-drop.
 */
export function BlockList({
  content,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onMove,
}: {
  content: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: BlockType) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-1.5">
        {content.length === 0 && <li className="rounded-xl border border-dashed border-input px-3.5 py-3 text-sm text-muted-foreground">No sections yet. Add one below.</li>}
        {content.map((block, index) => (
          <li key={block.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(block.id)}
              aria-pressed={selectedId === block.id}
              className={cn(
                "min-h-11 min-w-0 flex-1 truncate rounded-xl border px-3.5 text-left text-sm font-medium transition-colors duration-(--duration-fast)",
                selectedId === block.id
                  ? "border-primary bg-secondary"
                  : "border-input bg-card [@media(hover:hover)]:hover:bg-accent",
              )}
            >
              {BLOCK_LABELS[block.type]}
              {"heading" in block && block.heading ? ` — ${block.heading}` : ""}
              {block.type === "hero" && block.title ? ` — ${block.title}` : ""}
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => onMove(block.id, -1)}
            >
              <ChevronUpIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move down"
              disabled={index === content.length - 1}
              onClick={() => onMove(block.id, 1)}
            >
              <ChevronDownIcon />
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove block" onClick={() => onRemove(block.id)}>
              <Trash2Icon />
            </Button>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-1.5">
        {BLOCK_TYPES.map((type) => (
          <Button
            key={type}
            type="button"
            variant="outline"
            size="sm"
            disabled={!canAddBlock(content, type)}
            onClick={() => onAdd(type)}
          >
            <PlusIcon data-icon="inline-start" />
            {BLOCK_LABELS[type]}
          </Button>
        ))}
      </div>
    </div>
  );
}
