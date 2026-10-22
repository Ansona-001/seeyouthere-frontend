import Image from "next/image";
import type { ReactNode } from "react";

import type { ImageBlock as ImageBlockType, ImageRatio, ImageSize, MediaMap, MediaRef, SectionFade, SectionPhoto } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";

/** Width cap and the matching `sizes` hint per choice, so a small photo doesn't download the large rendition. */
const SIZES: Record<ImageSize, { box: string; sizes: string }> = {
  small: { box: "max-w-56", sizes: "14rem" },
  medium: { box: "max-w-sm", sizes: "(min-width: 400px) 24rem, 100vw" },
  large: { box: "max-w-2xl", sizes: "(min-width: 768px) 42rem, 100vw" },
  full: { box: "max-w-none", sizes: "100vw" },
};

/** Shape classes; `original` adds none, so the picture keeps its own proportions. Others centre-crop. */
const RATIOS: Record<ImageRatio, string> = {
  original: "",
  square: "aspect-square object-cover",
  landscape: "aspect-[3/2] object-cover",
  wide: "aspect-video object-cover",
  portrait: "aspect-[4/5] object-cover",
};

/**
 * A picture with no frame, radius or shadow: the edges feather into the page and `multiply` lets a light
 * picture background (paper, sky) take on the colour of the card behind it, so the photo reads as part of the
 * card rather than a pasted picture. `children` are laid over the picture.
 */
function BlendedPhoto({
  photo,
  size,
  ratio,
  alt,
  children,
}: {
  photo: MediaRef;
  size?: ImageSize;
  ratio?: ImageRatio;
  alt: string;
  children?: ReactNode;
}) {
  const box = SIZES[size || "large"] ?? SIZES.large;
  const shape = RATIOS[ratio || "original"] ?? "";

  return (
    <div className={`relative mx-auto ${box.box}`}>
      <Image
        src={photo.src}
        alt={alt}
        width={photo.width}
        height={photo.height}
        sizes={box.sizes}
        className={`h-auto w-full ${shape} mix-blend-multiply [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent),linear-gradient(to_bottom,transparent,#000_10%,#000_90%,transparent)] [-webkit-mask-composite:source-in]`}
      />
      {children}
    </div>
  );
}

export function ImageBlock({ block, media }: { block: ImageBlockType; media: MediaMap }) {
  const ref = media[block.media_id];
  if (!ref) return null;

  return (
    <figure className="px-0 py-4 @min-[640px]/ev:px-2">
      <BlendedPhoto photo={ref} size={block.size} ratio={block.ratio} alt={block.alt}>
        {/* The label and heading sit on top of the picture, near the top, with a soft glow in the card colour
            so they stay readable over detailed artwork. */}
        <BlockHeading
          kicker={block.kicker}
          heading={block.heading ?? ""}
          className="absolute inset-x-0 top-[8%] z-10 px-6 text-center [text-shadow:0_0_14px_var(--ev-surface),0_0_4px_var(--ev-surface)]"
        />
      </BlendedPhoto>
      {block.caption && <figcaption className="mt-2 text-center text-sm text-(--ev-muted)">{block.caption}</figcaption>}
    </figure>
  );
}

/** Opacity of the background picture per strength. */
const FADES: Record<SectionFade, string> = { soft: "opacity-25", medium: "opacity-45", strong: "opacity-70" };

/**
 * A section's optional background picture. It fills the section behind its content, faded and feathered at the
 * edges so neighbouring sections flow into it, and is decorative (hidden from assistive tech). Renders the
 * children alone until the picture's media is approved.
 */
export function SectionBackground({ photo, media, children }: { photo: SectionPhoto; media: MediaMap; children: ReactNode }) {
  const ref = media[photo.media_id];
  if (!ref) return <>{children}</>;
  return (
    <div className="relative isolate" data-ev-photo="">
      <div className="absolute inset-0 -z-10">
        <Image
          src={ref.src}
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className={`object-cover ${FADES[photo.fade || "medium"] ?? FADES.medium} [mask-composite:intersect] [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent),linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)] [-webkit-mask-composite:source-in]`}
        />
      </div>
      {children}
    </div>
  );
}
