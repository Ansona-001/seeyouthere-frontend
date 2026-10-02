"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Overrides, Palette, TemplateSummary } from "@/lib/api-types";
import { fontCssVar } from "@/lib/fonts";

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
        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <span>A newer version of this template is available.</span>
          <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(onUpgradeTemplate)}>
            Update
          </Button>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Template</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.slug}
              type="button"
              disabled={pending}
              aria-pressed={t.slug === templateSlug}
              onClick={() => t.slug !== templateSlug && run(() => onChangeTemplate(t.slug))}
              className={`rounded-lg border p-2 text-left text-sm transition-colors disabled:opacity-50 ${
                t.slug === templateSlug ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/40"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {template && (
        <>
          <div>
            <p className="mb-2 text-sm font-medium">Palette</p>
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
            <p className="mb-2 text-sm font-medium">Font</p>
            <div className="flex flex-wrap gap-2">
              {template.fonts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  disabled={pending}
                  aria-pressed={f.id === fontId}
                  onClick={() => run(() => onChangeOverrides({ palette: paletteId, font: f.id }))}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                    f.id === fontId ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/40"
                  }`}
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
      className={`flex items-center gap-1.5 rounded-full border p-1.5 transition-colors disabled:opacity-50 ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:bg-muted/40"
      }`}
    >
      {(["background", "accent", "text"] as const).map((k) => (
        <span key={k} className="size-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: palette.colors[k] }} />
      ))}
    </button>
  );
}
