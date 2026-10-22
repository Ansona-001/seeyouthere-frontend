"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

import { FutureDateTimeInput } from "@/components/future-datetime-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type Event } from "@/lib/api";
import type { Occasion, TemplateSummary } from "@/lib/api-types";

// A visitor who isn't signed in keeps their answers across the login redirect in sessionStorage
// (this tab only, cleared on restore). Everything read back is re-validated against the live
// question list, since storage is attacker-editable.
const DRAFT_KEY = "syt:create-draft";

type Restored = { answers: Record<string, string> };

type SavedDraft = { occasion: string; answers: Record<string, string> };

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

/** Parses and validates a saved draft against the live occasion; null if anything is off. */
function restoreDraft(raw: string | null, occasion: Occasion): Restored | null {
  if (!raw) return null;
  try {
    const d: unknown = JSON.parse(raw);
    if (typeof d !== "object" || d === null) return null;
    const { occasion: o, answers } = d as Record<string, unknown>;
    if (o !== occasion.slug) return null;
    if (typeof answers !== "object" || answers === null || Array.isArray(answers)) return null;
    const restored: Record<string, string> = {};
    for (const q of occasion.setup_questions) {
      const v = (answers as Record<string, unknown>)[q.key];
      if (typeof v === "string" && v.length <= 500) restored[q.key] = v;
    }
    return { answers: restored };
  } catch {
    return null;
  }
}

/**
 * Occasion setup (build-out plan §11.1): setup questions (when the occasion has
 * any), then `POST /v1/events`. Template, palette and fonts are chosen later in
 * the editor's design panel.
 * `content.BuildInitialContent` on the server does all the placeholder-copy
 * and answer-substitution work, so this only needs to collect answers — the
 * created event already has full, editable content.
 */
export function SetupWizard(props: { occasion: Occasion; templates: TemplateSummary[]; signedIn: boolean }) {
  // Coming back from login (?resume=1): restore what the visitor had picked and land on the
  // design step. The server renders without it, so the saved choices are read client-side.
  const resume = useSearchParams().get("resume") === "1";
  const raw = useSyncExternalStore(noopSubscribe, () => (resume && props.signedIn ? readDraft() : null), () => null);
  const initial = restoreDraft(raw, props.occasion);
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
  const [answers, setAnswers] = useState<Record<string, string>>(initial?.answers ?? {});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The look is chosen in the editor; new events start from the occasion's first template.
  const template = templates[0];

  const browserTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }, []);
  function answerFor(key: string, questionType: string): string {
    if (answers[key] !== undefined) return answers[key];
    return questionType === "timezone" ? browserTimezone : "";
  }

  // The date picker takes the chosen time zone, so "not in the past" is judged on that zone's clock.
  const tzQuestion = occasion.setup_questions.find((q) => q.type === "timezone");

  const missingRequired = occasion.setup_questions.some((q) => q.required && !answerFor(q.key, q.type).trim());

  function submit(e: FormEvent) {
    e.preventDefault();
    if (missingRequired) return;
    void create();
  }

  async function create() {
    setError(null);
    const finalAnswers: Record<string, string> = {};
    for (const q of occasion.setup_questions) {
      const value = answerFor(q.key, q.type).trim();
      if (value) finalAnswers[q.key] = value;
    }
    if (!signedIn) {
      saveDraft({ occasion: occasion.slug, answers: finalAnswers });
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

  const submitLabel = pending ? "Creating…" : signedIn ? "Create my event" : "Log in to create my event";

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <p className="text-sm font-medium text-brand-brass-ink">Almost there</p>
        <h1 className="mt-1 font-heading text-4xl text-brand-heading sm:text-5xl">
          {hasQuestions ? "Tell us a bit more" : "Ready to start?"}
        </h1>
        {!hasQuestions && (
          <p className="mt-2 text-muted-foreground">You can pick the template and colours in the editor.</p>
        )}
      </header>

      {error && (
        <p role="alert" className="text-center text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      {hasQuestions ? (
        <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          {/* The time zone question is not shown: the event starts in the creator's zone and follows the venue's map link once one is added in the editor. */}
          {occasion.setup_questions.filter((q) => q.type !== "timezone").map((q) => (
            <div key={q.key} className="grid gap-1.5">
              <Label htmlFor={`q-${q.key}`}>
                {q.label}
                {!q.required && <span className="text-muted-foreground"> (optional)</span>}
              </Label>
              {q.type === "date_time" ? (
                <FutureDateTimeInput
                  id={`q-${q.key}`}
                  timeZone={tzQuestion ? answerFor(tzQuestion.key, "timezone") : browserTimezone}
                  value={answerFor(q.key, q.type)}
                  onValueChange={(value) => setAnswers((a) => ({ ...a, [q.key]: value }))}
                  required={q.required}
                  autoFocus={occasion.setup_questions[0].key === q.key}
                />
              ) : (
                <Input
                  id={`q-${q.key}`}
                  type="text"
                  value={answerFor(q.key, q.type)}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                  required={q.required}
                  maxLength={q.max_length > 0 ? q.max_length : 60}
                  autoFocus={occasion.setup_questions[0].key === q.key}
                />
              )}
            </div>
          ))}
          <Button type="submit" size="lg" disabled={missingRequired || pending}>
            {submitLabel}
          </Button>
        </form>
      ) : (
        <div className="flex justify-center">
          <Button type="button" size="lg" onClick={create} disabled={pending}>
            {submitLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
