"use client";

import { ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";
import type { Block, BlockType } from "@/lib/api-types";

import { BLOCK_LABELS, BLOCK_TYPES, canAddBlock } from "./blocks";

function blockTitle(block: Block): string {
  const extra = block.type === "hero" ? block.title : "heading" in block ? block.heading : "";
  return extra ? `${BLOCK_LABELS[block.type]} — ${extra}` : BLOCK_LABELS[block.type];
}

/**
 * Section list with add/remove/reorder controls (build-out plan §11.4). Two levels, like a page
 * builder's side panel: a list of sections, and — after tapping one — just that section's fields
 * with a way back. Keyboard accessible by design: every action is a real `<button>`, moved with
 * dedicated up/down controls rather than drag-and-drop.
 */
export function BlockList({
  content,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onMove,
  renderForm,
  issuesByBlock,
}: {
  content: Block[];
  /** Blocks the last save rejected; their rows are flagged so the problem is visible from the list. */
  issuesByBlock: Map<string, unknown[]>;
  /** The section being edited, or null to show the list. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (type: BlockType) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  /** Fields for a block, shown while that block is selected. */
  renderForm: (block: Block) => React.ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  const selected = selectedId ? content.find((b) => b.id === selectedId) : undefined;

  if (selected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
            <ArrowLeftIcon data-icon="inline-start" />
            All sections
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(selected.id)}>
            <Trash2Icon data-icon="inline-start" />
            Remove
          </Button>
        </div>
        <h3 className="font-heading text-lg text-brand-heading">{BLOCK_LABELS[selected.type]}</h3>
        <div id={`block-panel-${selected.id}`}>{renderForm(selected)}</div>
      </div>
    );
  }

  const addable = BLOCK_TYPES.filter((type) => canAddBlock(content, type));

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-1.5">
        {content.length === 0 && <li className="rounded-xl border border-dashed border-input px-3.5 py-3 text-sm text-muted-foreground">No sections yet. Add one below.</li>}
        {content.map((block, index) => (
          <li key={block.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onSelect(block.id)}
              className={cn(
                "flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border px-3.5 text-left text-sm font-medium transition-colors duration-(--duration-fast)",
                issuesByBlock.has(block.id) ? "border-destructive bg-destructive/5" : "border-input bg-card [@media(hover:hover)]:hover:bg-accent",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{blockTitle(block)}</span>
              {issuesByBlock.has(block.id) && <span className="shrink-0 text-xs font-semibold text-destructive">Needs attention</span>}
              <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${BLOCK_LABELS[block.type]} up`}
              // The hero is always drawn first, whatever its position, so it stays pinned at the top.
              disabled={index === 0 || block.type === "hero" || content[index - 1]?.type === "hero"}
              onClick={() => onMove(block.id, -1)}
            >
              <ChevronUpIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${BLOCK_LABELS[block.type]} down`}
              disabled={index === content.length - 1 || block.type === "hero"}
              onClick={() => onMove(block.id, 1)}
            >
              <ChevronDownIcon />
            </Button>
          </li>
        ))}
      </ol>

      {addable.length > 0 && (
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" aria-expanded={adding} onClick={() => setAdding((v) => !v)}>
            <PlusIcon data-icon="inline-start" />
            Add a section
          </Button>
          {adding && (
            <div className="flex flex-wrap gap-1.5">
              {addable.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAdding(false);
                    onAdd(type);
                  }}
                >
                  {BLOCK_LABELS[type]}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
