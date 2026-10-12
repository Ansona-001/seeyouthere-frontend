"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type Event } from "@/lib/api";
import type { Occasion, TemplateSummary } from "@/lib/api-types";
import { fontCssVar } from "@/lib/fonts";

type Step = "questions" | "design";

// A visitor who isn't signed in keeps their choices across the login redirect in sessionStorage
// (this tab only, cleared on restore). Everything read back is re-validated against the live
// template/question lists, since storage is attacker-editable.
const DRAFT_KEY = "syt:create-draft";

type Restored = { answers: Record<string, string>; template: string };

type SavedDraft = { occasion: string; answers: Record<string, string>; template: string };

function saveDraft(draft: SavedDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage can be blocked; the visitor just re-picks after logging in.
  }
}

function readDraft(): string | null {
  try {
    return sessionStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear if storage is blocked.
  }
}

const noopSubscribe = () => () => {};

/** Parses and validates a saved draft against the live occasion/templates; null if anything is off. */
function restoreDraft(raw: string | null, occasion: Occasion, templates: TemplateSummary[]): Restored | null {
  if (!raw) return null;
  try {
    const d: unknown = JSON.parse(raw);
    if (typeof d !== "object" || d === null) return null;
    const { occasion: o, answers, template } = d as Record<string, unknown>;
    if (o !== occasion.slug || typeof template !== "string") return null;
    if (typeof answers !== "object" || answers === null || Array.isArray(answers)) return null;
    const tpl = templates.find((t) => t.slug === template);
    if (!tpl) return null;
    const restored: Record<string, string> = {};
    for (const q of occasion.setup_questions) {
      const v = (answers as Record<string, unknown>)[q.key];
      if (typeof v === "string" && v.length <= 500) restored[q.key] = v;
    }
    return { answers: restored, template: tpl.slug };
  } catch {
    return null;
  }
}

/**
 * Occasion setup wizard (build-out plan §11.1, §11.4): setup questions (when
 * the occasion has any), then the template, then `POST /v1/events`. Palette and fonts are
 * chosen later in the editor's design panel.
 * `content.BuildInitialContent` on the server does all the placeholder-copy
 * and answer-substitution work, so this only needs to collect answers and a
 * design choice — the created event already has full, editable content.
 */
export function SetupWizard(props: { occasion: Occasion; templates: TemplateSummary[]; signedIn: boolean }) {
  // Coming back from login (?resume=1): restore what the visitor had picked and land on the
  // design step. The server renders without it, so the saved choices are read client-side.
  const resume = useSearchParams().get("resume") === "1";
  const raw = useSyncExternalStore(noopSubscribe, () => (resume && props.signedIn ? readDraft() : null), () => null);
  const initial = restoreDraft(raw, props.occasion, props.templates);
  return <SetupWizardInner key={initial ? "restored" : "fresh"} {...props} initial={initial} />;
}

function SetupWizardInner({
  occasion,
  templates,
  signedIn,
  initial,
}: {
  occasion: Occasion;
  templates: TemplateSummary[];
  signedIn: boolean;
  initial: Restored | null;
}) {
  const router = useRouter();
  const hasQuestions = occasion.setup_questions.length > 0;
  const [step, setStep] = useState<Step>(initial || !hasQuestions ? "design" : "questions");
  const [answers, setAnswers] = useState<Record<string, string>>(initial?.answers ?? {});
  const [templateSlug, setTemplateSlug] = useState(initial?.template ?? templates[0].slug);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const template = templates.find((t) => t.slug === templateSlug) ?? templates[0];

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
    const finalAnswers: Record<string, string> = {};
    for (const q of occasion.setup_questions) {
      const value = answerFor(q.key, q.type).trim();
      if (value) finalAnswers[q.key] = value;
    }
    if (!signedIn) {
      saveDraft({ occasion: occasion.slug, answers: finalAnswers, template: template.slug });
      const back = `/create/${occasion.slug}?resume=1`;
      router.push(`/login?next=${encodeURIComponent(back)}`);
      return;
    }
    setPending(true);
    try {
      const { event } = await api<{ event: Event }>("/v1/events", {
        method: "POST",
        json: { occasion_slug: occasion.slug, template_slug: template.slug, answers: finalAnswers },
      });
      clearDraft();
      router.push(`/edit/${event.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Please try again.");
      setPending(false);
    }
  }

  // Back from login with the choices restored: the visitor already pressed create, so finish the job.
  // The ref keeps React's dev double-run from creating two events.
  const autoCreated = useRef(false);
  useEffect(() => {
    if (!initial || !signedIn || autoCreated.current) return;
    autoCreated.current = true;
    void create();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on arrival; create reads current state
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <p className="text-sm font-medium text-brand-brass-ink">
          {hasQuestions ? `Step ${step === "questions" ? 1 : 2} of 2` : "Almost there"}
        </p>
        <h1 className="mt-1 font-heading text-4xl text-brand-heading sm:text-5xl">
          {step === "questions" ? "Tell us a bit more" : "Pick a look"}
        </h1>
      </header>

      {step === "questions" ? (
        <form onSubmit={goToDesign} className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
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
                  className="h-11.5 w-full min-w-0 rounded-md border border-input bg-card px-3 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-(--duration-fast) focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/28 motion-reduce:transition-none"
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
          <Button type="submit" size="lg" disabled={missingRequired}>
            Continue
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 font-heading text-xl text-brand-heading">Template</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {templates.map((t) => (
                <TemplateCard key={t.slug} template={t} occasionSlug={occasion.slug} selected={t.slug === templateSlug} onSelect={() => selectTemplate(t)} />
              ))}
            </div>
          </section>

          {error && (
            <p role="alert" className="text-center text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            {hasQuestions ? (
              <Button type="button" size="lg" variant="outline" onClick={() => setStep("questions")} disabled={pending}>
                Back
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" size="lg" onClick={create} disabled={pending}>
              {pending ? "Creating…" : signedIn ? "Create my event" : "Log in to create my event"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const choiceBase =
  "inline-flex items-center border bg-card outline-none transition-[border-color,box-shadow,background-color] duration-(--duration-fast) focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none";
const choiceOn = "border-primary bg-secondary ring-2 ring-primary/30";
const choiceOff = "border-input hover:bg-accent";

/** Slugs that ship a preview at public/templates/<slug>.webp; anything else (e.g. admin-created) gets the swatch. */
const PREVIEW_SLUGS: ReadonlySet<string> = new Set([
  "olive-grove", "letterpress", "velvet-foil", "sunlit", "sprinkles", "risograph",
  "cloud-nine", "gingham", "open-door", "terrazzo", "gilt-noir", "mirror-ball",
  "heirloom", "confetti", "classic", "garden", "modern", "minimal",
]);

/**
 * Occasion-specific previews at public/templates/<slug>--<occasion>.webp for the
 * v1 templates. Keys are a static allowlist: the occasion comes from
 * the route, so it is never interpolated into a URL unless it is listed here.
 */
const OCCASION_PREVIEWS: ReadonlySet<string> = new Set([
  ...["wedding", "engagement", "birthday", "baby-shower", "housewarming", "party"].flatMap((o) => [
    `classic--${o}`,
    `modern--${o}`,
    `minimal--${o}`,
  ]),
  ...["birthday", "party", "baby-shower", "housewarming"].map((o) => `confetti--${o}`),
  ...["wedding", "engagement", "baby-shower"].map((o) => `garden--${o}`),
  ...["wedding", "engagement"].map((o) => `heirloom--${o}`),
]);

/** Template option: a preview of the invite (or a palette/font swatch when none exists), plus its name. */
function TemplateCard({
  template,
  occasionSlug,
  selected,
  onSelect,
}: {
  template: TemplateSummary;
  occasionSlug: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const palette = template.palettes.find((p) => p.id === template.defaults.palette) ?? template.palettes[0];
  const font = template.fonts.find((f) => f.id === template.defaults.font) ?? template.fonts[0];
  const variant = `${template.slug}--${occasionSlug}`;
  const previewSrc = OCCASION_PREVIEWS.has(variant) ? `/templates/${variant}.webp` : `/templates/${template.slug}.webp`;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`${choiceBase} flex-col items-stretch gap-2 rounded-2xl p-2 focus-visible:ring-3 text-left ${selected ? choiceOn : choiceOff}`}
    >
      {PREVIEW_SLUGS.has(template.slug) ? (
        // Decorative: the name caption below already identifies the template.
        <Image
          src={previewSrc}
          alt=""
          width={390}
          height={520}
          // Static, pre-compressed files; the site's custom loader only serves media renditions.
          unoptimized
          loading="lazy"
          className="aspect-3/4 w-full rounded-xl object-cover object-top ring-1 ring-foreground/10"
          style={{ backgroundColor: palette.colors.background }}
        />
      ) : (
        <span
          aria-hidden
          className="grid aspect-3/4 place-items-center rounded-xl text-3xl ring-1 ring-foreground/10"
          style={{
            backgroundColor: palette.colors.background,
            color: palette.colors.text,
            fontFamily: fontCssVar(font.heading),
          }}
        >
          <span>
            Aa<span style={{ color: palette.colors.accent }}>.</span>
          </span>
        </span>
      )}
      <span className="px-1 pb-1">
        <span className="block font-heading text-base text-brand-heading">{template.name}</span>
        <span className="block text-xs text-muted-foreground capitalize">
          {template.layout} · {template.hero_style.replace("_", " ")}
        </span>
      </span>
    </button>
  );
}
