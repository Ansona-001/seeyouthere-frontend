"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Overrides, Palette, TemplateSummary } from "@/lib/api-types";
import { fontCssVar } from "@/lib/fonts";
import { cn } from "cn";

const CHOICE =
  "min-h-11 rounded-xl border bg-card text-left text-sm font-medium transition-[background-color,border-color,box-shadow] duration-(--duration-fast) disabled:opacity-50";
const CHOICE_ON = "border-primary bg-secondary ring-2 ring-ring/40";
const CHOICE_OFF = "border-input [@media(hover:hover)]:hover:bg-accent";

/**
 * Template / palette / font picker (build-out plan §11.4). Every change here
 * saves immediately (not debounced with content edits) because the resolved
 * `theme` the live preview needs only ever comes back on the server response.
 */
export function DesignPanel({
  templates,
  templateSlug,
  templateVersion,
  templateLatestVersion,
  overrides,
  onChangeTemplate,
  onChangeOverrides,
  onUpgradeTemplate,
}: {
  templates: TemplateSummary[];
  templateSlug: string;
  templateVersion: number;
  templateLatestVersion: number;
  overrides: Overrides;
  onChangeTemplate: (slug: string) => Promise<boolean>;
  onChangeOverrides: (overrides: Overrides) => Promise<boolean>;
  onUpgradeTemplate: () => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);
  const template = templates.find((t) => t.slug === templateSlug);
  const paletteId = overrides.palette || template?.defaults.palette || "";
  const fontId = overrides.font || template?.defaults.font || "";

  async function run(action: () => Promise<boolean>) {
    if (pending) return;
    setPending(true);
    await action();
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {templateVersion < templateLatestVersion && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
          <span>A newer version of this template is available.</span>
          <Button type="button" variant="outline" disabled={pending} onClick={() => run(onUpgradeTemplate)}>
            Update
          </Button>
        </div>
      )}

      <div>
        <p id="design-template" className="mb-2 text-sm font-semibold">Template</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.slug}
              type="button"
              disabled={pending}
              aria-pressed={t.slug === templateSlug}
              onClick={() => t.slug !== templateSlug && run(() => onChangeTemplate(t.slug))}
              className={cn(CHOICE, "flex flex-col gap-2 p-2", t.slug === templateSlug ? CHOICE_ON : CHOICE_OFF)}
            >
              <TemplateSwatch template={t} />
              <span className="px-0.5">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {template && (
        <>
          <div>
            <p className="mb-2 text-sm font-semibold">Colours</p>
            <div className="flex flex-wrap gap-2">
              {template.palettes.map((p) => (
                <PaletteSwatch
                  key={p.id}
                  palette={p}
                  selected={p.id === paletteId}
                  disabled={pending}
                  onSelect={() => run(() => onChangeOverrides({ palette: p.id, font: fontId }))}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Font</p>
            <div className="flex flex-wrap gap-2">
              {template.fonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={pending}
                  aria-pressed={f.id === fontId}
                  onClick={() => run(() => onChangeOverrides({ palette: paletteId, font: f.id }))}
                  className={cn(CHOICE, "px-3.5", f.id === fontId ? CHOICE_ON : CHOICE_OFF)}
                  style={{ fontFamily: fontCssVar(f.heading) }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PaletteSwatch({
  palette,
  selected,
  disabled,
  onSelect,
}: {
  palette: Palette;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={palette.name}
      title={palette.name}
      className={cn(
        "flex min-h-11 items-center gap-1.5 rounded-full border bg-card px-3 transition-[background-color,border-color,box-shadow] duration-(--duration-fast) disabled:opacity-50",
        selected ? CHOICE_ON : CHOICE_OFF,
      )}
    >
      {(["background", "accent", "text"] as const).map((k) => (
        <span key={k} className="size-5 rounded-full ring-1 ring-border" style={{ backgroundColor: palette.colors[k] }} />
      ))}
    </button>
  );
}

/** Strip of the template's default palette so themes are recognisable at a glance. */
function TemplateSwatch({ template }: { template: TemplateSummary }) {
  const palette = template.palettes.find((p) => p.id === template.defaults.palette) ?? template.palettes[0];
  if (!palette) return <span aria-hidden className="h-8 rounded-lg bg-muted" />;
  const { background, surface, accent, text } = palette.colors;
  return (
    <span aria-hidden className="flex h-8 overflow-hidden rounded-lg ring-1 ring-border">
      {[background, surface, accent, text].map((color, i) => (
        <span key={i} className="flex-1" style={{ backgroundColor: color }} />
      ))}
    </span>
  );
}
