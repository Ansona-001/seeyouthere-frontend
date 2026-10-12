"use client";

import { useEffect, useReducer, useRef, useState } from "react";

import { EventView } from "@/components/event/event-view";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError, type Event, type Occasion, type Overrides, type TemplateSummary, type ValidationIssue } from "@/lib/api";

import { BlockForm } from "./block-form";
import { BlockList } from "./block-list";
import { canAddBlock, createBlock } from "./blocks";
import { DesignPanel } from "./design-panel";
import { editorReducer, editorStateFromEvent } from "./reducer";
import { SettingsPanel } from "./settings-panel";

export function Editor({
  initialEvent,
  occasion,
  templates,
}: {
  initialEvent: Event;
  occasion: Occasion | null;
  templates: TemplateSummary[];
}) {
  const [state, dispatch] = useReducer(editorReducer, editorStateFromEvent(initialEvent));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(initialEvent.content[0]?.id ?? null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const savingContentRef = useRef(false);
  const retryContentRef = useRef(false);

  function handleSaveError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.code === "version_conflict") {
        const details = err.details as { current_version: number } | undefined;
        dispatch({ type: "conflict", currentVersion: details?.current_version ?? stateRef.current.version });
        return;
      }
      dispatch({
        type: "save_error",
        message: err.message,
        issues: Array.isArray(err.details) && err.code === "validation_failed" ? (err.details as ValidationIssue[]) : undefined,
      });
      return;
    }
    dispatch({ type: "save_error", message: "Couldn't reach the server. Please try again." });
  }

  async function saveContent() {
    if (savingContentRef.current) {
      retryContentRef.current = true;
      return;
    }
    savingContentRef.current = true;
    dispatch({ type: "save_start" });
    try {
      const { event } = await api<{ event: Event }>(`/v1/events/${stateRef.current.id}`, {
        method: "PATCH",
        json: { version: stateRef.current.version, content: stateRef.current.content, overrides: stateRef.current.overrides },
      });
      dispatch({ type: "applied", event, templateSlug: event.template.slug });
    } catch (err) {
      handleSaveError(err);
    } finally {
      savingContentRef.current = false;
      if (retryContentRef.current) {
        retryContentRef.current = false;
        saveContent();
      }
    }
  }

  async function saveOverridesNow(overrides: Overrides): Promise<boolean> {
    dispatch({ type: "set_overrides", overrides });
    dispatch({ type: "save_start" });
    try {
      const { event } = await api<{ event: Event }>(`/v1/events/${stateRef.current.id}`, {
        method: "PATCH",
        json: { version: stateRef.current.version, overrides },
      });
      dispatch({ type: "applied", event, templateSlug: event.template.slug });
      return true;
    } catch (err) {
      handleSaveError(err);
      return false;
    }
  }

  async function saveTemplateNow(slug: string): Promise<boolean> {
    dispatch({ type: "save_start" });
    try {
      const { event } = await api<{ event: Event }>(`/v1/events/${stateRef.current.id}`, {
        method: "PATCH",
        json: { version: stateRef.current.version, template_slug: slug, overrides: { palette: "", font: "" } },
      });
      dispatch({ type: "applied", event, templateSlug: event.template.slug });
      return true;
    } catch (err) {
      handleSaveError(err);
      return false;
    }
  }

  async function upgradeTemplateNow(): Promise<boolean> {
    dispatch({ type: "save_start" });
    try {
      const { event } = await api<{ event: Event }>(`/v1/events/${stateRef.current.id}/template/upgrade`, {
        method: "POST",
        json: { version: stateRef.current.version },
      });
      dispatch({ type: "applied", event, templateSlug: event.template.slug });
      return true;
    } catch (err) {
      handleSaveError(err);
      return false;
    }
  }

  // Autosave for drafts only, 1.5 s after the last change; published events
  // use the explicit "Save changes" button below (build-out plan §11.4).
  // Deliberately depends only on [content, overrides] so a `saveStatus`
  // transition (idle -> saving -> saved) doesn't itself reschedule the timer.
  useEffect(() => {
    if (!stateRef.current.dirty || stateRef.current.saveStatus === "conflict") return;
    if (stateRef.current.status !== "draft") return;
    const timer = setTimeout(() => {
      saveContent();
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.content, state.overrides]);

  useEffect(() => {
    if (!state.dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [state.dirty]);

  function setContent(content: typeof state.content) {
    dispatch({ type: "set_content", content });
  }

  function updateBlock(id: string, patch: Partial<(typeof state.content)[number]>) {
    setContent(state.content.map((b) => (b.id === id ? ({ ...b, ...patch } as typeof b) : b)));
  }

  function addBlock(type: Parameters<typeof createBlock>[0]) {
    if (!canAddBlock(state.content, type)) return;
    const block = createBlock(type);
    setContent([...state.content, block]);
    setSelectedBlockId(block.id);
    setMobileView("edit");
  }

  function removeBlock(id: string) {
    setContent(state.content.filter((b) => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  }

  function moveBlock(id: string, direction: -1 | 1) {
    const index = state.content.findIndex((b) => b.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= state.content.length) return;
    const next = state.content.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setContent(next);
  }

  async function reload() {
    window.location.reload();
  }

  const selectedBlock = state.content.find((b) => b.id === selectedBlockId) ?? null;
  const editingDisabled = state.saveStatus === "conflict";
  const canPublishNow = Boolean(occasion);

  return (
    <div className="flex min-h-dvh flex-col">
      <EditorTopBar state={state} onReload={reload} onSaveNow={saveContent} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 flex-col gap-6 border-b p-4 lg:w-[420px] lg:shrink-0 lg:border-r lg:border-b-0 lg:overflow-y-auto">
          <Tabs value={mobileView} onValueChange={(v) => setMobileView((v as "edit" | "preview") ?? "edit")} className="lg:hidden">
            <TabsList className="w-full">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className={mobileView === "preview" ? "hidden lg:block" : ""}>
            <fieldset disabled={editingDisabled} className="flex flex-col gap-6">
              <section>
                <h2 className="mb-2 font-heading text-base text-brand-heading">Content</h2>
                <BlockList
                  content={state.content}
                  selectedId={selectedBlockId}
                  onSelect={setSelectedBlockId}
                  onAdd={addBlock}
                  onRemove={removeBlock}
                  onMove={moveBlock}
                />
                {selectedBlock && (
                  <div className="mt-4 rounded-xl bg-card p-4 ring-1 ring-border">
                    <BlockForm
                      block={selectedBlock}
                      occasion={occasion}
                      eventId={state.id}
                      media={state.media}
                      onChange={(patch) => updateBlock(selectedBlock.id, patch)}
                      onMediaUploaded={(id, ref) => dispatch({ type: "add_media", id, ref })}
                    />
                  </div>
                )}
              </section>

              <section>
                <h2 className="mb-2 font-heading text-base text-brand-heading">Design</h2>
                <DesignPanel
                  templates={templates}
                  templateSlug={state.templateSlug}
                  templateVersion={state.templateVersion}
                  templateLatestVersion={state.templateLatestVersion}
                  overrides={state.overrides}
                  onChangeTemplate={saveTemplateNow}
                  onChangeOverrides={saveOverridesNow}
                  onUpgradeTemplate={upgradeTemplateNow}
                />
              </section>

              <section>
                <h2 className="mb-2 font-heading text-base text-brand-heading">Settings</h2>
                <SettingsPanel state={state} dispatch={dispatch} canPublish={canPublishNow} />
              </section>
            </fieldset>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto ${mobileView === "edit" ? "hidden lg:block" : ""}`}>
          <EventView
            content={state.content}
            theme={state.theme}
            media={state.media}
            mode="preview"
            removeBranding={state.removeBranding}
            slug={state.slug ?? undefined}
            startsAt={state.startsAt}
          />
        </div>
      </div>
    </div>
  );
}

function EditorTopBar({
  state,
  onReload,
  onSaveNow,
}: {
  state: ReturnType<typeof editorStateFromEvent>;
  onReload: () => void;
  onSaveNow: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
      <div>
        <p className="font-heading text-lg text-brand-heading">{state.title || "Untitled event"}</p>
        <SaveIndicator state={state} />
      </div>
      <div className="flex items-center gap-2">
        {state.status !== "draft" && (
          <Button onClick={onSaveNow} disabled={!state.dirty || state.saveStatus === "saving" || state.saveStatus === "conflict"}>
            {state.saveStatus === "saving" ? "Saving…" : "Save changes"}
          </Button>
        )}
      </div>

      {state.saveStatus === "conflict" && (
        <div role="alert" className="w-full rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          This event was changed somewhere else.{" "}
          <button type="button" className="min-h-11 font-semibold underline" onClick={onReload}>
            Reload to see the latest version.
          </button>
        </div>
      )}
      {state.saveStatus === "error" && state.saveMessage && (
        <div role="alert" className="w-full rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.saveMessage}
          {state.saveIssues && state.saveIssues.length > 0 && (
            <ul className="mt-1 list-inside list-disc">
              {state.saveIssues.map((issue, i) => (
                <li key={i}>
                  {issue.path}: {issue.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </header>
  );
}

function SaveIndicator({ state }: { state: ReturnType<typeof editorStateFromEvent> }) {
  if (state.saveStatus === "conflict") return null;
  const text =
    state.saveStatus === "saving"
      ? "Saving…"
      : state.saveStatus === "error"
        ? "Couldn't save"
        : state.dirty
          ? "Unsaved changes"
          : "All changes saved";
  return <p role="status" className="text-sm text-muted-foreground">{text}</p>;
}
