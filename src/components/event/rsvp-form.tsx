"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type ClosedReason, type FieldDef, type Rsvp, type RsvpAnswerValue } from "@/lib/api";

export type RsvpFormProps = {
  mode: "live" | "preview";
  /** Required in live mode: builds the submit URL. */
  slug?: string;
  /** Effective occasion fields (already resolved by the API — never parsed here). */
  fields: FieldDef[];
  /** Host-defined questions from the RSVP block. */
  questions: FieldDef[];
  maxPartySize: number;
  spotsLeft: number | null;
  closedReason: ClosedReason;
  /** Set (and locked) when the viewer arrived through an invite link. */
  guestName?: string;
  existingRsvp?: Rsvp | null;
  onSuccess?: (rsvp: Rsvp) => void;
};

type Attending = "yes" | "no" | "maybe";
const ATTENDING_OPTIONS: readonly Attending[] = ["yes", "maybe", "no"];

export function RsvpForm({
  mode,
  slug,
  fields,
  questions,
  maxPartySize,
  spotsLeft,
  closedReason,
  guestName,
  existingRsvp,
  onSuccess,
}: RsvpFormProps) {
  const formId = useId();
  const disabled = mode === "preview";
  const allFields = [...fields, ...questions];

  const [name, setName] = useState(existingRsvp?.name ?? guestName ?? "");
  const [email, setEmail] = useState(existingRsvp?.email ?? "");
  const [attending, setAttending] = useState<Attending>(existingRsvp?.attending ?? "yes");
  const [count, setCount] = useState(existingRsvp?.count ?? 1);
  const [answers, setAnswers] = useState<Record<string, RsvpAnswerValue>>(() => existingRsvp?.answers ?? {});
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const deadlinePassed = closedReason === "deadline";
  const atCapacity = closedReason === "capacity" && spotsLeft !== null && spotsLeft <= 0;
  const yesLocked = atCapacity && existingRsvp?.attending !== "yes";
  const formDisabled = disabled || deadlinePassed;

  function setAnswer(key: string, value: RsvpAnswerValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (formDisabled || !slug) return;
    setError(null);
    setPending(true);
    try {
      const result = await api<{ rsvp: Rsvp }>(`/v1/public/events/${encodeURIComponent(slug)}/rsvp`, {
        method: "PUT",
        json: {
          name,
          email: email || undefined,
          attending,
          count: attending === "no" ? 0 : count,
          answers: attending === "no" ? {} : answers,
          website, // honeypot — empty for real visitors, filled by bots
        },
      });
      setSubmitted(true);
      onSuccess?.(result.rsvp);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <p role="status" className="rounded-xl bg-(--ev-surface) px-4 py-6 text-center text-(--ev-text)">
        {attending === "no" ? "Thanks for letting us know." : "You're on the list. See you there!"}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-col gap-4">
      {deadlinePassed && (
        <p role="alert" className="rounded-lg bg-(--ev-surface) px-3 py-2 text-sm text-(--ev-muted)">
          RSVPs are closed for this event.
        </p>
      )}
      {yesLocked && attending === "yes" && !deadlinePassed && (
        <p role="alert" className="rounded-lg bg-(--ev-surface) px-3 py-2 text-sm text-(--ev-muted)">
          We&apos;ve reached capacity for &quot;yes&quot; RSVPs. You can still let the host know you can&apos;t make
          it.
        </p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor={`${formId}-name`}>Your name</Label>
        <Input
          id={`${formId}-name`}
          required
          maxLength={120}
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={formDisabled || Boolean(guestName)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor={`${formId}-email`}>Email (optional)</Label>
        <Input
          id={`${formId}-email`}
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email ?? ""}
          onChange={(e) => setEmail(e.target.value)}
          disabled={formDisabled}
        />
      </div>

      <fieldset className="grid gap-1.5" disabled={formDisabled}>
        <legend className="text-sm font-medium">Will you be there?</legend>
        <div className="flex gap-2">
          {ATTENDING_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex flex-1 cursor-pointer items-center justify-center rounded-lg border border-input px-3 py-2 text-sm font-medium capitalize has-checked:border-(--ev-accent) has-checked:bg-(--ev-accent)/10 has-disabled:cursor-not-allowed has-disabled:opacity-50"
            >
              <input
                type="radio"
                name={`${formId}-attending`}
                value={option}
                checked={attending === option}
                onChange={() => setAttending(option)}
                disabled={formDisabled || (option === "yes" && yesLocked)}
                className="sr-only"
              />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      {attending !== "no" && (
        <div className="grid gap-1.5">
          <Label htmlFor={`${formId}-count`}>Party size (incl. you)</Label>
          <Input
            id={`${formId}-count`}
            type="number"
            inputMode="numeric"
            min={1}
            max={maxPartySize}
            required
            value={count}
            onChange={(e) => setCount(Math.min(maxPartySize, Math.max(1, Number(e.target.value) || 1)))}
            disabled={formDisabled}
          />
        </div>
      )}

      {attending !== "no" &&
        allFields.map((field) => (
          <RsvpField
            key={field.key}
            field={field}
            value={answers[field.key]}
            onChange={(value) => setAnswer(field.key, value)}
            disabled={formDisabled}
            idPrefix={formId}
          />
        ))}

      {/* Honeypot: hidden from real visitors; a filled value makes the API silently no-op. */}
      <div className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Leave this field empty</label>
        <input
          id={`${formId}-website`}
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={formDisabled || pending}
        className="bg-(--ev-accent) text-(--ev-accent-text) hover:opacity-90"
      >
        {pending ? "Sending…" : existingRsvp ? "Update RSVP" : "Send RSVP"}
      </Button>
    </form>
  );
}

function RsvpField({
  field,
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  field: FieldDef;
  value: RsvpAnswerValue | undefined;
  onChange: (value: RsvpAnswerValue) => void;
  disabled: boolean;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${field.key}`;
  const fieldLabel = (
    <>
      {field.label}
      {field.required && <span aria-hidden="true"> *</span>}
    </>
  );

  if (field.type === "boolean") {
    return (
      <label htmlFor={id} className="flex items-center gap-2 text-sm has-disabled:opacity-50">
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="size-4 rounded border-input"
        />
        {fieldLabel}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{fieldLabel}</Label>
        <select
          id={id}
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        >
          <option value="" disabled>
            Choose…
          </option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="grid gap-1.5" disabled={disabled}>
        <legend className="text-sm font-medium">{fieldLabel}</legend>
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-1.5 rounded-full border border-input px-3 py-1 text-sm has-checked:border-(--ev-accent) has-checked:bg-(--ev-accent)/10 has-disabled:cursor-not-allowed has-disabled:opacity-50"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={selected.includes(opt)}
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked ? [...selected, opt] : selected.filter((v) => v !== opt))}
              />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "number") {
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{fieldLabel}</Label>
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={field.min ?? undefined}
          max={field.max ?? undefined}
          required={field.required}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={disabled}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={id}>{fieldLabel}</Label>
        <Textarea
          id={id}
          maxLength={field.max_length}
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{fieldLabel}</Label>
      <Input
        id={id}
        maxLength={field.max_length}
        required={field.required}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
