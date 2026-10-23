"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  occasionSlug,
  templateSlug,
  templateVersion,
  templateLatestVersion,
  overrides,
  canToggleBoxes,
  onChangeTemplate,
  onChangeOverrides,
  onUpgradeTemplate,
}: {
  templates: TemplateSummary[];
  occasionSlug: string;
  templateSlug: string;
  templateVersion: number;
  templateLatestVersion: number;
  overrides: Overrides;
  /** Only schema-2 templates can drop their section boxes. */
  canToggleBoxes: boolean;
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
            <TemplateCard
              key={t.slug}
              template={t}
              occasionSlug={occasionSlug}
              selected={t.slug === templateSlug}
              disabled={pending}
              onSelect={() => t.slug !== templateSlug && run(() => onChangeTemplate(t.slug))}
            />
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
                  onSelect={() => run(() => onChangeOverrides({ ...overrides, palette: p.id, font: fontId }))}
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
                  onClick={() => run(() => onChangeOverrides({ ...overrides, palette: paletteId, font: f.id }))}
                  className={cn(CHOICE, "px-3.5", f.id === fontId ? CHOICE_ON : CHOICE_OFF)}
                  style={{ fontFamily: fontCssVar(f.heading) }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          {canToggleBoxes && (
            <div className="flex items-center gap-3">
              <Switch
                id="design-boxes"
                checked={overrides.boxes !== "off"}
                disabled={pending}
                onCheckedChange={(on) => run(() => onChangeOverrides({ ...overrides, boxes: on ? "" : "off" }))}
              />
              <Label htmlFor="design-boxes">Boxes around sections</Label>
            </div>
          )}
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

/** Slugs that ship a preview at public/templates/<slug>.webp; anything else (e.g. admin-created) gets a swatch. */
const PREVIEW_SLUGS: ReadonlySet<string> = new Set([
  "olive-grove", "letterpress", "velvet-foil", "sunlit", "sprinkles", "risograph",
  "cloud-nine", "gingham", "open-door", "terrazzo", "gilt-noir", "mirror-ball",
  "heirloom", "confetti", "classic", "garden", "modern", "minimal", "mimosa", "harvest", "marigold", "wildflower",
]);

/**
 * Occasion-specific previews at public/templates/<slug>--<occasion>.webp for the
 * v1 templates. Keys are a static allowlist: the occasion comes from
 * the event, so it is never interpolated into a URL unless it is listed here.
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

/** Template option: a preview of the full invite (or a palette/font swatch when none exists), plus its name. */
function TemplateCard({
  template,
  occasionSlug,
  selected,
  disabled,
  onSelect,
}: {
  template: TemplateSummary;
  occasionSlug: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const palette = template.palettes.find((p) => p.id === template.defaults.palette) ?? template.palettes[0];
  const font = template.fonts.find((f) => f.id === template.defaults.font) ?? template.fonts[0];
  const variant = `${template.slug}--${occasionSlug}`;
  const previewSrc = OCCASION_PREVIEWS.has(variant) ? `/templates/${variant}.webp` : `/templates/${template.slug}.webp`;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(CHOICE, "flex flex-col items-stretch gap-2 rounded-2xl p-2", selected ? CHOICE_ON : CHOICE_OFF)}
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
          style={{ backgroundColor: palette?.colors.background }}
        />
      ) : (
        <span
          aria-hidden
          className="grid aspect-3/4 place-items-center rounded-xl text-3xl ring-1 ring-foreground/10"
          style={{
            backgroundColor: palette?.colors.background,
            color: palette?.colors.text,
            fontFamily: font ? fontCssVar(font.heading) : undefined,
          }}
        >
          <span>
            Aa<span style={{ color: palette?.colors.accent }}>.</span>
          </span>
        </span>
      )}
      <span className="px-1 pb-1">
        <span className="block font-heading text-base text-brand-heading">{template.name}</span>
        <span className="block text-xs font-normal text-muted-foreground capitalize">
          {template.layout} · {template.hero_style.replace("_", " ")}
        </span>
      </span>
    </button>
  );
}
