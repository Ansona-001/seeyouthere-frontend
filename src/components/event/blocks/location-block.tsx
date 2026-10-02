import type { LocationBlock as LocationBlockType } from "@/lib/api-types";
import { googleMapsEmbedUrl, googleMapsSearchUrl, isSafeHttpsUrl } from "@/lib/urls";

import { BlockHeading } from "../block-heading";
import { MapEmbed } from "../map-embed";
import { EvCard } from "../surface";

export function LocationBlock({
  block,
  interactive,
}: {
  block: LocationBlockType;
  /** false in the editor preview: clicking "Show map" never loads the Google iframe. */
  interactive: boolean;
}) {
  const mapHref = isSafeHttpsUrl(block.map_url) ? block.map_url : block.address ? googleMapsSearchUrl(block.address) : null;
  // Only ever built from our own validated `address` text, never from
  // `block.map_url` — see googleMapsEmbedUrl's doc comment.
  const embedSrc = block.address ? googleMapsEmbedUrl(block.address) : null;

  return (
    <section className="flex flex-col items-center px-2 py-8 text-center">
      <EvCard className="flex w-full flex-col items-center gap-2">
        <BlockHeading kicker={block.kicker} heading={block.heading} />
        <p className="text-lg font-medium">{block.name}</p>
        {block.address && <p className="text-(--ev-muted)">{block.address}</p>}
        {block.notes && <p className="max-w-prose whitespace-pre-line text-sm text-(--ev-muted)">{block.notes}</p>}
        {block.address && (
          <div className="mt-2 aspect-video w-full max-w-2xl overflow-hidden rounded-xl">
            <MapEmbed
              src={embedSrc}
              title={`Map: ${block.name || block.address}`}
              label={block.address}
              interactive={interactive}
            />
          </div>
        )}
        {mapHref && (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-(--ev-accent)/30 px-4 py-1.5 text-sm font-medium text-(--ev-accent) transition-colors hover:bg-(--ev-accent)/10"
          >
            Open in Maps
          </a>
        )}
      </EvCard>
    </section>
  );
}
