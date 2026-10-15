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

/**
 * Required fields the server insists on, checked locally so an empty one is flagged in the content list
 * before any save or publish fails: a start time on the Date & time block, a venue name on Location.
 */
function missingRequired(block: Block): BlockIssue | null {
  if (block.type === "datetime" && block.start_local.trim() === "") return { field: "start_local", message: "Choose a date and time." };
  if (block.type === "location" && block.name.trim() === "") return { field: "name", message: "Enter the venue name." };
  return null;
}

/** Server issues from the last save plus locally detected missing required fields, grouped by block id. */
export function blockIssues(content: Block[], saveIssues: ValidationIssue[] | null): Map<string, BlockIssue[]> {
  const grouped = groupIssuesByBlock(content, saveIssues);
  for (const block of content) {
    const missing = missingRequired(block);
    if (!missing) continue;
    const list = grouped.get(block.id) ?? [];
    if (!list.some((i) => i.field === missing.field)) list.push(missing);
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

/** Per-person fields of the People block, each rendered with its own inline error (`people[0].name`). */
const PERSON_FIELD = /^people\[\d+\]\.(name|role|family_label|family_names|place|bio)$/;

export function uninlinedIssues(type: BlockType, issues: BlockIssue[]): BlockIssue[] {
  const inline = INLINE_FIELDS[type] ?? [];
  return issues.filter((i) => !inline.includes(i.field) && !(type === "people" && PERSON_FIELD.test(i.field)));
}

/** What one row of a repeatable list is called in a given block ("Person 1", "Question 2"). */
const ROW_NOUN: Partial<Record<BlockType, string>> = {
  people: "Person",
  schedule: "Schedule item",
  links: "Link",
  faq: "Question",
  wishes: "Wish",
  gallery: "Photo",
  rsvp: "Question",
};

const ITEM_PATH = /^(\w+)\[(\d+)\]\.?(.*)$/;

function humanise(field: string): string {
  const text = field.replace(/[_.]+/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Reader-friendly label for an issue's field path: "people[0].name" becomes "Person 1 – Name" and
 * "heading" becomes "Heading". An empty path (a whole-block issue) has no label.
 */
export function issueLabel(type: BlockType, field: string): string {
  const item = ITEM_PATH.exec(field);
  if (!item) return humanise(field);
  const row = `${ROW_NOUN[type] ?? "Item"} ${Number(item[2]) + 1}`;
  return item[3] ? `${row} – ${humanise(item[3])}` : row;
}

const BlockIssuesContext = createContext<BlockIssue[]>([]);

export const BlockIssuesProvider = BlockIssuesContext.Provider;

/** The first error for `field` in the block currently being edited, if any. */
export function useFieldError(field: string | undefined): string | undefined {
  const issues = useContext(BlockIssuesContext);
  return field === undefined ? undefined : issues.find((i) => i.field === field)?.message;
}
