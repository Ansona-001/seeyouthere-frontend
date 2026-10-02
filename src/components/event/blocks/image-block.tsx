import Image from "next/image";

import type { ImageBlock as ImageBlockType, MediaMap } from "@/lib/api-types";

export function ImageBlock({ block, media }: { block: ImageBlockType; media: MediaMap }) {
  const ref = media[block.media_id];
  if (!ref) return null;

  return (
    <figure className="px-0 py-4 sm:px-2">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl">
        <Image
          src={ref.src}
          alt={block.alt}
          width={ref.width}
          height={ref.height}
          sizes="(min-width: 768px) 42rem, 100vw"
          className="h-auto w-full object-cover"
        />
      </div>
      {block.caption && <figcaption className="mt-2 text-center text-sm text-(--ev-muted)">{block.caption}</figcaption>}
    </figure>
  );
}
