import Image from "next/image";

import type { GalleryBlock as GalleryBlockType, MediaMap } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";
import { Carousel } from "../carousel";

export function GalleryBlock({
  block,
  media,
  mode,
}: {
  block: GalleryBlockType;
  media: MediaMap;
  mode: "live" | "preview";
}) {
  const images = block.images.map((img) => ({ ...img, ref: media[img.media_id] })).filter((img) => img.ref);
  if (images.length === 0) return null;

  if (block.display === "carousel") {
    return (
      <section className="px-0 py-8 sm:px-2">
        <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-5 text-center" />
        <div className="mx-auto max-w-2xl">
          <Carousel label={block.heading || "Photos"} variant="slide" autoplayMs={4500} interactive={mode === "live"}>
            {images.map((img) => (
              <div key={img.media_id} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-(--ev-surface)/40">
                <Image
                  src={img.ref!.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 42rem, 100vw"
                  className="object-contain"
                />
              </div>
            ))}
          </Carousel>
        </div>
      </section>
    );
  }

  return (
    <section className="px-0 py-8 sm:px-2">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-5 text-center" />
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((img) => (
          <div key={img.media_id} className="aspect-square overflow-hidden rounded-lg">
            <Image src={img.ref!.src} alt={img.alt} width={480} height={480} className="size-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
