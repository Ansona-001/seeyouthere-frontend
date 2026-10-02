import Image from "next/image";

import type { Decoration, HeroBlock as HeroBlockType, HeroStyle, MediaMap } from "@/lib/api-types";

import { DecorationDivider } from "../decorations";
import { Kicker } from "../kicker";

export function HeroBlock({
  block,
  heroStyle,
  decoration,
  media,
}: {
  block: HeroBlockType;
  heroStyle: HeroStyle;
  decoration: Decoration;
  media: MediaMap;
}) {
  const image = block.image ? media[block.image.media_id] : undefined;

  if (heroStyle === "full_bleed" && image) {
    return (
      <div className="relative flex min-h-[70vh] w-full items-end overflow-hidden sm:min-h-screen lg:h-dvh lg:min-h-0">
        <Image
          src={image.src}
          alt={block.image?.alt ?? ""}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="relative z-10 w-full px-6 pb-10 text-white sm:px-10 sm:pb-16">
          {block.kicker && <Kicker className="text-white/90">{block.kicker}</Kicker>}
          <h1 className="text-4xl font-semibold [font-family:var(--ev-font-heading)] sm:text-6xl">{block.title}</h1>
          {block.subtitle && <p className="mt-3 max-w-xl text-lg text-white/90">{block.subtitle}</p>}
        </div>
      </div>
    );
  }

  // `spotlight` (rich-blocks extension §4.3): full-screen centred text hero,
  // an optional circular portrait above the kicker, and a bigger display
  // title. `svh` (not `vh`) so mobile browser chrome collapsing doesn't
  // clip the hero.
  if (heroStyle === "spotlight") {
    return (
      <div className="flex min-h-[85svh] flex-col items-center justify-center px-6 py-14 text-center">
        {image && (
          <div className="mb-6 size-40 overflow-hidden rounded-full ring-2 ring-(--ev-accent)/40">
            <Image
              src={image.src}
              alt={block.image?.alt ?? ""}
              width={320}
              height={320}
              className="size-full object-cover"
            />
          </div>
        )}
        {block.kicker && <Kicker>{block.kicker}</Kicker>}
        <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-semibold text-(--ev-text) [font-family:var(--ev-font-heading)]">
          {block.title}
        </h1>
        {block.subtitle && <p className="mt-3 max-w-md text-lg text-(--ev-muted)">{block.subtitle}</p>}
        <DecorationDivider decoration={decoration} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-6 pt-14 pb-2 text-center sm:pt-20">
      {heroStyle === "framed" && image && (
        <div className="mb-6 aspect-4/5 w-full max-w-xs overflow-hidden rounded-2xl ring-1 ring-(--ev-accent)/20 sm:max-w-sm">
          <Image
            src={image.src}
            alt={block.image?.alt ?? ""}
            width={480}
            height={600}
            className="size-full object-cover"
          />
        </div>
      )}
      {block.kicker && <Kicker>{block.kicker}</Kicker>}
      <h1 className="text-4xl font-semibold text-(--ev-text) [font-family:var(--ev-font-heading)] sm:text-5xl">
        {block.title}
      </h1>
      {block.subtitle && <p className="mt-3 max-w-md text-lg text-(--ev-muted)">{block.subtitle}</p>}
      <DecorationDivider decoration={decoration} />
    </div>
  );
}
