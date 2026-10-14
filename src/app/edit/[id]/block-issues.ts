import { createContext, useContext } from "react";

import type { Block, BlockType, ValidationIssue } from "@/lib/api-types";

/** A save error mapped to the block it belongs to; `field` is the path inside the block ("name", "items[0].title"). */
export type BlockIssue = { field: string; message: string };

const ISSUE_PATH = /^content\[(\d+)\]\.?(.*)$/;

/** Groups the API's validation issues by the id of the block they point at; issues outside any block are dropped. */
export function groupIssuesByBlock(content: Block[], issues: ValidationIssue[] | null): Map<string, BlockIssue[]> {
  const grouped = new Map<string, BlockIssue[]>();
  for (const issue of issues ?? []) {
    const match = ISSUE_PATH.exec(issue.path);
    const block = match ? content[Number(match[1])] : undefined;
    if (!match || !block) continue;
    const list = grouped.get(block.id) ?? [];
    list.push({ field: match[2], message: issue.message });
    grouped.set(block.id, list);
  }
  return grouped;
}

/** Top-level fields whose form renders its own inline error; every other issue is listed above the block's form. */
const INLINE_FIELDS: Partial<Record<BlockType, readonly string[]>> = {
  hero: ["kicker", "title", "subtitle"],
  text: ["kicker", "heading", "body"],
  datetime: ["kicker", "heading", "start_local", "end_local", "timezone"],
  location: ["kicker", "heading", "name", "address", "map_url", "notes"],
};

export function uninlinedIssues(type: BlockType, issues: BlockIssue[]): BlockIssue[] {
  const inline = INLINE_FIELDS[type] ?? [];
  return issues.filter((i) => !inline.includes(i.field));
}

const BlockIssuesContext = createContext<BlockIssue[]>([]);

export const BlockIssuesProvider = BlockIssuesContext.Provider;

/** The first error for `field` in the block currently being edited, if any. */
export function useFieldError(field: string | undefined): string | undefined {
  const issues = useContext(BlockIssuesContext);
  return field === undefined ? undefined : issues.find((i) => i.field === field)?.message;
}
