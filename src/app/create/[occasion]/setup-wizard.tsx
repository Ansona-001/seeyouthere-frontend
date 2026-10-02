"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { themeStyle } from "@/components/event/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type Event } from "@/lib/api";
import type { Occasion, Palette, TemplateSummary } from "@/lib/api-types";
import { fontCssVar } from "@/lib/fonts";

type Step = "questions" | "design";

/**
 * Occasion setup wizard (build-out plan §11.1, §11.4): setup questions (when
 * the occasion has any), then template/palette/font, then `POST /v1/events`.
 * `content.BuildInitialContent` on the server does all the placeholder-copy
 * and answer-substitution work, so this only needs to collect answers and a
 * design choice — the created event already has full, editable content.
 */
export function SetupWizard({ occasion, templates }: { occasion: Occasion; templates: TemplateSummary[] }) {
  const router = useRouter();
  const hasQuestions = occasion.setup_questions.length > 0;
  const [step, setStep] = useState<Step>(hasQuestions ? "questions" : "design");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [templateSlug, setTemplateSlug] = useState(templates[0].slug);
  const [paletteId, setPaletteId] = useState(templates[0].defaults.palette);
  const [fontId, setFontId] = useState(templates[0].defaults.font);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = templates.find((t) => t.slug === templateSlug) ?? templates[0];
  const palette = template.palettes.find((p) => p.id === paletteId) ?? template.palettes[0];
  const fontPair = template.fonts.find((f) => f.id === fontId) ?? template.fonts[0];

  const browserTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, []);
  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      return [browserTimezone];
    }
  }, [browserTimezone]);

  function selectTemplate(next: TemplateSummary) {
    setTemplateSlug(next.slug);
    setPaletteId(next.defaults.palette);
    setFontId(next.defaults.font);
  }

  function answerFor(key: string, questionType: string): string {
    if (answers[key] !== undefined) return answers[key];
    return questionType === "timezone" ? browserTimezone : "";
  }

  const missingRequired = occasion.setup_questions.some((q) => q.required && !answerFor(q.key, q.type).trim());

  function goToDesign(e: FormEvent) {
    e.preventDefault();
    if (missingRequired) return;
    setStep("design");
  }

  async function create() {
    setError(null);
    setPending(true);
    try {
      const finalAnswers: Record<string, string> = {};
      for (const q of occasion.setup_questions) {
        const value = answerFor(q.key, q.type).trim();
        if (value) finalAnswers[q.key] = value;
      }
      const { event } = await api<{ event: Event }>("/v1/events", {
        method: "POST",
        json: { occasion_slug: occasion.slug, template_slug: template.slug, answers: finalAnswers },
      });
      if (event.overrides.palette !== paletteId || event.overrides.font !== fontId) {
        try {
          await api(`/v1/events/${event.id}`, {
            method: "PATCH",
            json: { version: event.version, overrides: { palette: paletteId, font: fontId } },
          });
        } catch {
          // The event itself was created fine; the design panel in the editor
          // can still set the palette/font, so this isn't worth blocking on.
        }
      }
      router.push(`/edit/${event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {hasQuestions ? `Step ${step === "questions" ? 1 : 2} of 2` : "Almost there"}
        </p>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {step === "questions" ? "Tell us a bit more" : "Pick a look"}
        </h1>
      </header>

      {step === "questions" ? (
        <form onSubmit={goToDesign} className="mx-auto flex w-full max-w-md flex-col gap-4">
          {occasion.setup_questions.map((q) => (
            <div key={q.key} className="grid gap-1.5">
              <Label htmlFor={`q-${q.key}`}>
                {q.label}
                {!q.required && <span className="text-muted-foreground"> (optional)</span>}
              </Label>
              {q.type === "timezone" ? (
                <select
                  id={`q-${q.key}`}
                  value={answerFor(q.key, q.type)}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                  required={q.required}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`q-${q.key}`}
                  type={q.type === "date_time" ? "datetime-local" : "text"}
                  value={answerFor(q.key, q.type)}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                  required={q.required}
                  maxLength={q.max_length > 0 ? q.max_length : 60}
                  autoFocus={occasion.setup_questions[0].key === q.key}
                />
              )}
            </div>
          ))}
          <Button type="submit" disabled={missingRequired}>
            Continue
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Template</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {templates.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => selectTemplate(t)}
                  aria-pressed={t.slug === templateSlug}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    t.slug === templateSlug ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <p className="font-heading text-sm font-medium">{t.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground capitalize">
                    {t.layout} · {t.hero_style.replace("_", " ")}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Palette</h2>
            <div className="flex flex-wrap gap-2">
              {template.palettes.map((p) => (
                <PaletteSwatch key={p.id} palette={p} selected={p.id === paletteId} onSelect={() => setPaletteId(p.id)} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">Fonts</h2>
            <div className="flex flex-wrap gap-2">
              {template.fonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFontId(f.id)}
                  aria-pressed={f.id === fontId}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    f.id === fontId ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/40"
                  }`}
                  style={{ fontFamily: fontCssVar(f.heading) }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </section>

          <section aria-label="Preview">
            <div
              style={themeStyle({ ...emptyTheme, layout: template.layout, hero_style: template.hero_style, decoration: template.decoration, palette: palette.colors, fonts: { heading: fontPair.heading, body: fontPair.body } })}
              className="rounded-2xl bg-(--ev-bg) p-8 text-center ring-1 ring-foreground/10"
            >
              <p className="text-3xl font-semibold text-(--ev-text) [font-family:var(--ev-font-heading)]">
                {occasion.copy.title_template.replace(/\{[a-z0-9_]+\}/gi, "…")}
              </p>
              <p className="mt-2 text-(--ev-muted) [font-family:var(--ev-font-body)]">{occasion.copy.tagline}</p>
            </div>
          </section>

          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-between gap-3">
            {hasQuestions ? (
              <Button type="button" variant="outline" onClick={() => setStep("questions")} disabled={pending}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" onClick={create} disabled={pending}>
              {pending ? "Creating…" : "Create my event"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const emptyTheme = { background: null } as const;

function PaletteSwatch({
  palette,
  selected,
  onSelect,
}: {
  palette: Palette;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={palette.name}
      title={palette.name}
      className={`flex items-center gap-1.5 rounded-full border p-1.5 transition-colors ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/40"
      }`}
    >
      {(["background", "accent", "text"] as const).map((k) => (
        <span
          key={k}
          className="size-4 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: palette.colors[k] }}
        />
      ))}
    </button>
  );
}
