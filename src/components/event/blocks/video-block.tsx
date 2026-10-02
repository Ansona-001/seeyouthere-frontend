import type { MediaMap, VideoBlock as VideoBlockType } from "@/lib/api-types";
import { ASPECT_CLASS } from "@/lib/video";

import { BlockHeading } from "../block-heading";
import { EvCard } from "../surface";
import { VideoEmbed } from "../video-embed";

export function VideoBlock({
  block,
  media,
  interactive,
}: {
  block: VideoBlockType;
  media: MediaMap;
  /** false in the editor preview: the facade renders but never loads the provider iframe. */
  interactive: boolean;
}) {
  const poster = block.poster_media_id ? media[block.poster_media_id] : undefined;

  return (
    <section className="px-2 py-8 sm:px-4">
      <BlockHeading kicker={block.kicker} heading={block.heading} className="mb-6 text-center" />
      <EvCard as="div" className={`mx-auto overflow-hidden rounded-2xl ${ASPECT_CLASS[block.aspect]}`}>
        <VideoEmbed
          provider={block.provider}
          video_id={block.video_id}
          vimeo_hash={block.vimeo_hash}
          poster={poster}
          posterAlt={block.caption}
          title={block.heading}
          interactive={interactive}
        />
      </EvCard>
      {block.caption && <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-(--ev-muted)">{block.caption}</p>}
    </section>
  );
}
