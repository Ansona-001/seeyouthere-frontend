import Image from "next/image";

import type { GuestPhotosBlock as GuestPhotosBlockType, PhotoItem } from "@/lib/api-types";

import { BlockHeading } from "../block-heading";
import { PhotoGallery } from "../photo-gallery";
import { PhotoUpload } from "../photo-upload";

export function GuestPhotosBlock({
  block,
  mode,
  slug,
  photos,
  photosNextCursor = null,
}: {
  block: GuestPhotosBlockType;
  mode: "live" | "preview";
  slug?: string;
  photos?: PhotoItem[];
  /** Cursor for `GET .../photos` (§4.4); only meaningful in `live` mode with a `slug`. */
  photosNextCursor?: string | null;
}) {
  const canPage = mode === "live" && Boolean(slug);

  return (
    <section className="flex flex-col items-center gap-4 px-2 py-10 text-center">
      <BlockHeading kicker={block.kicker} heading={block.heading} />
      {block.body && <p className="max-w-prose whitespace-pre-line text-(--ev-muted)">{block.body}</p>}
      {block.open && slug && <PhotoUpload slug={slug} mode={mode} />}
      {canPage ? (
        <PhotoGallery slug={slug!} initialItems={photos ?? []} initialCursor={photosNextCursor} />
      ) : (
        photos &&
        photos.length > 0 && (
          <div className="grid w-full max-w-2xl grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className="aspect-square overflow-hidden rounded-lg">
                <Image src={photo.src} alt="" width={480} height={480} className="size-full object-cover" />
              </div>
            ))}
          </div>
        )
      )}
    </section>
  );
}
