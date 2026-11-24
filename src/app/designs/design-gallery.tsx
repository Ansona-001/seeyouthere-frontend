"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { PremiumBadge } from "@/components/premium-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Occasion, TemplateSummary } from "@/lib/api-types";
import { fontCssVar } from "@/lib/fonts";
import { templatePreviewSrc } from "@/lib/template-preview";
import { cn } from "cn";

const CHIP =
  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// One row on phones (scrolls sideways inside itself), wrapping and centred from `sm` up.
const CHIP_ROW =
  "flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 [&>button]:shrink-0 [&::-webkit-scrollbar]:hidden";

type Tier = "free" | "premium";

function defaultsOf(t: TemplateSummary) {
  return {
    palette: t.palettes.find((p) => p.id === t.defaults.palette) ?? t.palettes[0],
    font: t.fonts.find((f) => f.id === t.defaults.font) ?? t.fonts[0],
  };
}

/** Preview image, or a palette/font swatch for designs that ship without one. */
function DesignArt({ template, occasionSlug, alt }: { template: TemplateSummary; occasionSlug: string | null; alt: string }) {
  const { palette, font } = defaultsOf(template);
  const src = templatePreviewSrc(template.slug, occasionSlug);
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={390}
        height={520}
        // Static, pre-compressed files; the site's custom loader only serves media renditions.
        unoptimized
        loading="lazy"
        className="aspect-3/4 w-full rounded-xl object-cover object-top ring-1 ring-foreground/10"
        style={{ backgroundColor: palette?.colors.background }}
      />
    );
  }
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className="grid aspect-3/4 w-full place-items-center rounded-xl text-4xl ring-1 ring-foreground/10"
      style={{
        backgroundColor: palette?.colors.background,
        color: palette?.colors.text,
        fontFamily: font ? fontCssVar(font.heading) : undefined,
      }}
    >
      <span aria-hidden>
        Aa<span style={{ color: palette?.colors.accent }}>.</span>
      </span>
    </span>
  );
}

function Swatches({ template }: { template: TemplateSummary }) {
  const { palette } = defaultsOf(template);
  if (!palette) return null;
  return (
    <span aria-hidden className="flex shrink-0 items-center gap-1">
      {(["background", "accent", "text"] as const).map((k) => (
        <span key={k} className="size-4 rounded-full ring-1 ring-border" style={{ backgroundColor: palette.colors[k] }} />
      ))}
    </span>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        CHIP,
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

/** Filterable grid of designs with a larger preview dialog. Filtering is client state: the whole catalog is already loaded. */
export function DesignGallery({ templates, occasions }: { templates: TemplateSummary[]; occasions: Occasion[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  // `selected` outlives `open` so the dialog keeps its content while it animates out.
  const [selected, setSelected] = useState<TemplateSummary | null>(null);
  const [open, setOpen] = useState(false);

  // Only occasions that have at least one design make a chip.
  const chips = occasions.filter((o) => templates.some((t) => t.tags.occasions?.includes(o.slug)));
  // The price chips only make sense while the catalog has both kinds.
  const hasBothTiers = templates.some((t) => t.is_premium) && templates.some((t) => !t.is_premium);
  const visible = templates.filter(
    (t) =>
      (!filter || t.tags.occasions?.includes(filter)) &&
      (!hasBothTiers || tier === null || t.is_premium === (tier === "premium")),
  );

  return (
    <>
      <div role="group" aria-label="Filter by occasion" className={CHIP_ROW}>
        <FilterChip active={filter === null} onClick={() => setFilter(null)}>
          All
        </FilterChip>
        {chips.map((o) => (
          <FilterChip key={o.slug} active={filter === o.slug} onClick={() => setFilter(o.slug)}>
            {o.name}
          </FilterChip>
        ))}
      </div>

      {hasBothTiers && (
        <div role="group" aria-label="Filter by price" className={CHIP_ROW}>
          <FilterChip active={tier === null} onClick={() => setTier(null)}>
            Free &amp; premium
          </FilterChip>
          <FilterChip active={tier === "free"} onClick={() => setTier("free")}>
            Free
          </FilterChip>
          <FilterChip active={tier === "premium"} onClick={() => setTier("premium")}>
            Premium
          </FilterChip>
        </div>
      )}

      <p role="status" className="text-center text-sm text-muted-foreground">
        Showing {visible.length} {visible.length === 1 ? "design" : "designs"}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((t) => (
          <li key={t.id} className="min-w-0">
            <button
              type="button"
              onClick={() => {
                setSelected(t);
                setOpen(true);
              }}
              className="flex w-full flex-col items-stretch gap-2 rounded-2xl bg-card p-2 text-left ring-1 ring-border transition-shadow hover:ring-foreground/25 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="relative block">
                {/* Decorative: the name caption below already labels the card. */}
                <DesignArt template={t} occasionSlug={filter} alt="" />
                {t.is_premium && (
                  <PremiumBadge isPremium className="absolute top-2 left-2 bg-card/90 shadow-sm backdrop-blur-sm" />
                )}
              </span>
              <span className="flex items-center justify-between gap-2 px-1 pb-1">
                <span className="min-w-0 truncate font-heading text-base text-brand-heading">{t.name}</span>
                <Swatches template={t} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          {selected && <Preview template={selected} occasions={occasions} filter={filter} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Preview({ template, occasions, filter }: { template: TemplateSummary; occasions: Occasion[]; filter: string | null }) {
  const { palette, font } = defaultsOf(template);
  // Keep catalog order and only offer occasions the app knows about.
  const suits = occasions.filter((o) => template.tags.occasions?.includes(o.slug));
  const href = (o: Occasion) => `/create/${encodeURIComponent(o.slug)}?template=${encodeURIComponent(template.slug)}`;

  return (
    <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
      <DesignArt template={template} occasionSlug={filter} alt={`Preview of the ${template.name} design`} />
      <div className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>
            {suits.length > 0 ? `Suits ${suits.map((o) => o.name.toLowerCase()).join(", ")}.` : "A look for your next invitation."}
          </DialogDescription>
        </DialogHeader>

        {template.is_premium && (
          <div className="flex flex-col gap-1.5">
            <PremiumBadge isPremium className="w-fit" />
            <p className="text-sm text-muted-foreground">
              Premium designs are free to design; a one-off unlock is needed to publish.
            </p>
          </div>
        )}

        <dl className="grid gap-3 text-sm">
          {palette && (
            <div>
              <dt className="font-medium text-foreground">Colours</dt>
              <dd className="mt-1 flex items-center gap-2 text-muted-foreground">
                <Swatches template={template} />
                {palette.name}
              </dd>
            </div>
          )}
          {font && (
            <div>
              <dt className="font-medium text-foreground">Fonts</dt>
              <dd className="mt-1 text-muted-foreground">{font.name}</dd>
            </div>
          )}
        </dl>

        {suits.length === 0 ? (
          <p className="text-sm text-muted-foreground">This design isn&rsquo;t available to start from yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {suits.map((o) => (
              <Button key={o.slug} size="lg" render={<Link href={href(o)} />} nativeButton={false}>
                {suits.length === 1 ? "Use this design" : `Use for ${o.name}`}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
