"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";

import { EventView } from "@/components/event/event-view";
import { ShareLinks } from "@/components/share-links";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError, type Event, type Occasion, type Overrides, type ShareImageSource, type TemplateSummary, type ValidationIssue } from "@/lib/api";

import { BlockForm } from "./block-form";
import { BlockIssuesProvider, blockIssues, groupIssuesByBlock, uninlinedIssues } from "./block-issues";
import { BlockList } from "./block-list";
import { canAddBlock, createBlock } from "./blocks";
import { DesignPanel } from "./design-panel";
import { editorReducer, editorStateFromEvent } from "./reducer";
import { SettingsPanel } from "./settings-panel";
import { heroDrawsPhoto } from "./hero-fields";
import { SharePanel } from "./share-image-panel";

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
      const issues = Array.isArray(err.details) && err.code === "validation_failed" ? (err.details as ValidationIssue[]) : undefined;
      dispatch({ type: "save_error", message: err.message, issues });
      // Open the first block with a problem so the message is in view next to the field.
      const first = groupIssuesByBlock(stateRef.current.content, issues ?? null).keys().next();
      if (!first.done) {
        setSelectedBlockId(first.value);
        setMobileView("edit");
      }
      return;
    }
    dispatch({ type: "save_error", message: "Couldn't reach the server. Please try again." });
  }

  // Saves the content and returns the new event version, or null when nothing was saved (already
  // saving, conflict or error).
  async function saveContent(): Promise<number | null> {
    if (savingContentRef.current) {
      retryContentRef.current = true;
      return null;
    }
    savingContentRef.current = true;
    dispatch({ type: "save_start" });
    let saved: number | null = null;
    try {
      const { event } = await api<{ event: Event }>(`/v1/events/${stateRef.current.id}`, {
        method: "PATCH",
        json: { version: stateRef.current.version, content: stateRef.current.content, overrides: stateRef.current.overrides },
      });
      dispatch({ type: "applied", event, templateSlug: event.template.slug });
      saved = event.version;
    } catch (err) {
      handleSaveError(err);
    } finally {
      savingContentRef.current = false;
      if (retryContentRef.current) {
        retryContentRef.current = false;
        void saveContent();
      }
    }
    return saved;
  }

  // Settings and publish PATCH the same event row, so any edit still waiting for autosave (or an
  // autosave in flight) has to land first; otherwise the version moves under us and the server answers
  // "changed since you loaded it", or the settings response replaces the unsaved edits. Returns the
  // version to send, or null when the latest edits could not be saved.
  async function flushContent(): Promise<number | null> {
    for (let i = 0; i < 100 && savingContentRef.current; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (savingContentRef.current) return null;
    if (!stateRef.current.dirty) {
      // Let a just-applied save finish rendering so the ref holds its version.
      await new Promise((resolve) => setTimeout(resolve, 0));
      return stateRef.current.version;
    }
    return saveContent();
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

  // Saves any pending content edits first (the response replaces editor state), then the link-preview
  // image on its own so a rejected choice never blocks content autosave.
  async function saveShareImageNow(next: { source: ShareImageSource; mediaId: string | null }): Promise<boolean> {
    const version = await flushContent();
    if (version === null) return false;
    dispatch({ type: "save_start" });
    try {
      const { event } = await api<{ event: Event }>(`/v1/events/${stateRef.current.id}`, {
        method: "PATCH",
        json: {
          version,
          share_image: next.source === "custom" ? { source: "custom", media_id: next.mediaId } : { source: next.source },
        },
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

  const issuesByBlock = blockIssues(state.content, state.saveIssues);
  const editingDisabled = state.saveStatus === "conflict";
  const canPublishNow = Boolean(occasion);

  // On desktop the editor is pinned to the window (out of document flow), so the page itself can never
  // scroll; only the form and preview columns do. Anything in a theme that overflows is clipped here.
  return (
    <div className="flex min-h-dvh flex-col lg:fixed lg:inset-0 lg:min-h-0 lg:overflow-hidden">
      <EditorTopBar state={state} onReload={reload} onSaveNow={saveContent} />

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6 border-b p-4 lg:w-[420px] lg:shrink-0 lg:min-h-0 lg:border-r lg:border-b-0 lg:overflow-y-auto lg:pb-10 lg:overscroll-contain lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin] lg:[scrollbar-color:var(--border)_transparent]">
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
                  onSelect={(id) => setSelectedBlockId((current) => (current === id ? null : id))}
                  onAdd={addBlock}
                  onRemove={removeBlock}
                  onMove={moveBlock}
                  issuesByBlock={issuesByBlock}
                  renderForm={(block) => {
                    const issues = issuesByBlock.get(block.id) ?? [];
                    const other = uninlinedIssues(block.type, issues);
                    return (
                      <BlockIssuesProvider value={issues}>
                        {other.length > 0 && (
                          <ul role="alert" className="mb-3 list-inside list-disc rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {other.map((issue, i) => (
                              <li key={i}>{issue.field ? `${issue.field}: ${issue.message}` : issue.message}</li>
                            ))}
                          </ul>
                        )}
                        <BlockForm
                          block={block}
                          occasion={occasion}
                          eventId={state.id}
                          media={state.media}
                          theme={state.theme}
                          canModerate={state.role === "owner" || state.role === "editor"}
                          onChange={(patch) => updateBlock(block.id, patch)}
                          onMediaUploaded={(id, ref) => dispatch({ type: "add_media", id, ref })}
                        />
                      </BlockIssuesProvider>
                    );
                  }}
                />
              </section>

              <section>
                <h2 className="mb-2 font-heading text-base text-brand-heading">Design</h2>
                <DesignPanel
                  templates={templates}
                  occasionSlug={initialEvent.occasion_slug}
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
                <h2 className="mb-2 font-heading text-base text-brand-heading">Link preview</h2>
                <SharePanel
                  eventId={state.id}
                  source={state.shareImage.source}
                  mediaId={state.shareImage.mediaId}
                  media={state.media}
                  hasHeroImage={state.content.some((b) => b.type === "hero" && b.image !== null)}
                  heroDrawsPhoto={heroDrawsPhoto(state.theme)}
                  onSave={saveShareImageNow}
                  onUploaded={(id, ref) => dispatch({ type: "add_media", id, ref })}
                />
              </section>

              <section>
                <h2 className="mb-2 font-heading text-base text-brand-heading">Settings</h2>
                <SettingsPanel state={state} dispatch={dispatch} canPublish={canPublishNow} flushContent={flushContent} />
              </section>

              {state.status === "published" && state.url && (
                <section>
                  <h2 className="mb-2 font-heading text-base text-brand-heading">Share your invite</h2>
                  <ShareLinks url={state.url} title={state.title} />
                </section>
              )}
            </fieldset>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto lg:min-h-0 lg:overscroll-contain lg:[scrollbar-gutter:stable] lg:[scrollbar-width:thin] lg:[scrollbar-color:var(--border)_transparent] ${mobileView === "edit" ? "hidden lg:block" : ""}`}>
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
      <div className="flex items-center gap-3">
        <Link
          href={state.role === "anon" ? "/" : "/app"}
          aria-label={state.role === "anon" ? "Back to the home page" : "Back to your events"}
          className="inline-flex min-h-11 items-center gap-1 rounded-md pr-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span aria-hidden="true">&larr;</span>
          <span className="hidden sm:inline">{state.role === "anon" ? "Home" : "Your events"}</span>
        </Link>
        <div>
          <p className="font-heading text-lg text-brand-heading">{state.title || "Untitled event"}</p>
          <SaveIndicator state={state} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* New tab so opening Help never interrupts editing. */}
        <Link
          href="/help"
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          Help
        </Link>
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
