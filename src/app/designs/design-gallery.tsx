"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { PremiumBadge } from "@/components/premium-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RegionSelect } from "@/components/region-select";
import type { Occasion, Region, TemplateSummary } from "@/lib/api-types";
import { fontCssVar } from "@/lib/fonts";
import { priceLabel } from "@/lib/premium";
import { templatePreviewSrc } from "@/lib/template-preview";
import { useRegion } from "@/lib/use-region";
import { cn } from "cn";

const CHIP =
  "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const SEGMENT =
  "inline-flex min-h-9 items-center rounded-full px-4 text-sm font-medium transition-[background-color,color,box-shadow] motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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
function DesignArt({
  template,
  occasionSlug,
  alt,
  className,
}: {
  template: TemplateSummary;
  occasionSlug: string | null;
  alt: string;
  className?: string;
}) {
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
        className={cn("aspect-3/4 w-full rounded-xl object-cover object-top ring-1 ring-foreground/10", className)}
        style={{ backgroundColor: palette?.colors.background }}
      />
    );
  }
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn("grid aspect-3/4 w-full place-items-center rounded-xl text-4xl ring-1 ring-foreground/10", className)}
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
        active ? "border-primary bg-primary text-primary-foreground" : "border-transparent bg-muted text-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}

/** A small pill-shaped switch for one-of-few choices; the selected option lifts onto a card-coloured thumb. */
function Segment({ label, options }: { label: string; options: { value: Tier | null; text: string; active: boolean; onSelect: () => void }[] }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.text}
          type="button"
          aria-pressed={o.active}
          onClick={o.onSelect}
          className={cn(SEGMENT, o.active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
        >
          {o.text}
        </button>
      ))}
    </div>
  );
}

/** Filterable grid of designs with a larger preview dialog. Filtering is client state: the whole catalog is already loaded. */
export function DesignGallery({ templates, occasions }: { templates: TemplateSummary[]; occasions: Occasion[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  // `selected` outlives `open` so the dialog keeps its content while it animates out.
  const [selected, setSelected] = useState<TemplateSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [region] = useRegion();

  // Only occasions that have at least one design make a chip.
  const chips = occasions.filter((o) => templates.some((t) => t.tags.occasions?.includes(o.slug)));
  // The price chips only make sense while the catalog has both kinds.
  const hasPremium = templates.some((t) => t.is_premium);
  const hasBothTiers = hasPremium && templates.some((t) => !t.is_premium);
  const visible = templates.filter(
    (t) =>
      (!filter || t.tags.occasions?.includes(filter)) &&
      (!hasBothTiers || tier === null || t.is_premium === (tier === "premium")),
  );

  return (
    <>
      <div className="flex flex-col gap-3">
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

        {hasPremium && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-between">
            {hasBothTiers && (
              <Segment
                label="Filter by price"
                options={[
                  { value: null, text: "Any price", active: tier === null, onSelect: () => setTier(null) },
                  { value: "free", text: "Free", active: tier === "free", onSelect: () => setTier("free") },
                  { value: "premium", text: "Premium", active: tier === "premium", onSelect: () => setTier("premium") },
                ]}
              />
            )}
            <RegionSelect className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto" />
          </div>
        )}
      </div>

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
                <PremiumBadge
                  isPremium={t.is_premium}
                  price={priceLabel(t.prices, region)}
                  className="absolute top-2 left-2 bg-card/90 shadow-sm backdrop-blur-sm"
                />
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
        <DialogContent className="max-h-[calc(100dvh-2rem)] gap-3 overflow-y-auto p-4 sm:max-w-2xl sm:gap-4 sm:p-6">
          {selected && <Preview template={selected} occasions={occasions} filter={filter} region={region} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Preview({
  template,
  occasions,
  filter,
  region,
}: {
  template: TemplateSummary;
  occasions: Occasion[];
  filter: string | null;
  region: Region;
}) {
  const { palette, font } = defaultsOf(template);
  const price = priceLabel(template.prices, region);
  // Keep catalog order and only offer occasions the app knows about.
  const suits = occasions.filter((o) => template.tags.occasions?.includes(o.slug));
  const href = (o: Occasion) => `/create/${encodeURIComponent(o.slug)}?template=${encodeURIComponent(template.slug)}`;

  return (
    // On a phone everything fits one screen without scrolling: the picture is capped to a third of the height and
    // the details sit side by side; from `sm` it is the roomier two-column layout.
    <div className="grid gap-3 sm:grid-cols-2 sm:items-start sm:gap-5">
      <DesignArt
        template={template}
        occasionSlug={filter}
        alt={`Preview of the ${template.name} design`}
        className="mx-auto max-h-[34dvh] w-auto sm:max-h-none sm:w-full"
      />
      <div className="flex flex-col gap-3 sm:gap-4">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>
            {suits.length > 0 ? `Suits ${suits.map((o) => o.name.toLowerCase()).join(", ")}.` : "A look for your next invitation."}
          </DialogDescription>
        </DialogHeader>

        {template.is_premium && (
          <div className="flex items-start gap-2 sm:flex-col sm:gap-1.5">
            <PremiumBadge isPremium price={price} className="w-fit shrink-0" />
            <p className="text-sm leading-snug text-muted-foreground">
              Premium designs are free to design; a one-off unlock{price ? ` (${price} per event)` : ""} is needed to publish.
            </p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-1">
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
          <div className={cn("grid gap-2", suits.length > 1 && "grid-cols-2 sm:grid-cols-1")}>
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
