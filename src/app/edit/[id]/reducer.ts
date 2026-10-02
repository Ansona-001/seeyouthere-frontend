// Editor state (build-out plan §11.4). `useReducer` over content, overrides,
// template, version and save status. The server response after every
// successful write ("applied") is the single source of truth for `version`,
// `theme` and `media` — the client never computes those itself.

import type { Block, Event, EventRole, EventStatus, MediaMap, MediaRef, Overrides, RsvpMode, Theme, ValidationIssue, Visibility } from "@/lib/api-types";

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "conflict";

export type EditorState = {
  id: string;
  status: EventStatus;
  role: EventRole;
  slug: string | null;
  /** Once set, the slug can never change again (build-out plan §2.1, decision 7). */
  publishedAt: string | null;
  url: string | null;
  visibility: Visibility;
  hasPassword: boolean;
  rsvpMode: RsvpMode;
  notifyRsvps: boolean;
  removeBranding: boolean;
  version: number;
  content: Block[];
  overrides: Overrides;
  templateSlug: string;
  templateVersion: number;
  templateLatestVersion: number;
  theme: Theme;
  media: MediaMap;
  title: string;
  startsAt: string | null;
  dirty: boolean;
  saveStatus: SaveStatus;
  saveMessage: string | null;
  saveIssues: ValidationIssue[] | null;
  conflictVersion: number | null;
};

export type EditorAction =
  | { type: "applied"; event: Event; templateSlug: string }
  | { type: "set_content"; content: Block[] }
  | { type: "set_overrides"; overrides: Overrides }
  | { type: "set_template"; slug: string }
  | { type: "add_media"; id: string; ref: MediaRef }
  | { type: "save_start" }
  | { type: "save_error"; message: string; issues?: ValidationIssue[] }
  | { type: "conflict"; currentVersion: number }
  | { type: "clear_save_error" };

export function editorStateFromEvent(event: Event): EditorState {
  return {
    id: event.id,
    status: event.status,
    role: event.role,
    slug: event.slug,
    publishedAt: event.published_at,
    url: event.url,
    visibility: event.visibility,
    hasPassword: event.has_password,
    rsvpMode: event.rsvp_mode,
    notifyRsvps: event.notify_rsvps,
    removeBranding: event.remove_branding,
    version: event.version,
    content: event.content,
    overrides: event.overrides,
    templateSlug: event.template.slug,
    templateVersion: event.template.version,
    templateLatestVersion: event.template.latest_version,
    theme: event.theme,
    media: event.media,
    title: event.title,
    startsAt: event.starts_at,
    dirty: false,
    saveStatus: "saved",
    saveMessage: null,
    saveIssues: null,
    conflictVersion: null,
  };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "applied": {
      const next = editorStateFromEvent(action.event);
      return next;
    }
    case "set_content":
      if (state.saveStatus === "conflict") return state;
      return { ...state, content: action.content, dirty: true, saveStatus: "idle", saveMessage: null, saveIssues: null };
    case "set_overrides":
      if (state.saveStatus === "conflict") return state;
      return { ...state, overrides: action.overrides, dirty: true, saveStatus: "idle", saveMessage: null, saveIssues: null };
    case "set_template":
      if (state.saveStatus === "conflict") return state;
      return { ...state, templateSlug: action.slug, dirty: true, saveStatus: "idle", saveMessage: null, saveIssues: null };
    case "add_media":
      return { ...state, media: { ...state.media, [action.id]: action.ref } };
    case "save_start":
      return { ...state, saveStatus: "saving" };
    case "save_error":
      return { ...state, saveStatus: "error", saveMessage: action.message, saveIssues: action.issues ?? null };
    case "conflict":
      return { ...state, saveStatus: "conflict", conflictVersion: action.currentVersion, saveMessage: null, saveIssues: null };
    case "clear_save_error":
      return { ...state, saveMessage: null, saveIssues: null, saveStatus: state.dirty ? "idle" : "saved" };
    default:
      return state;
  }
}
