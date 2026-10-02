"use client";

import { use } from "react";

import { AcceptLink } from "../accept-link";

export default function RsvpEditPage({ params }: PageProps<"/[slug]/rsvp">) {
  const { slug } = use(params);

  return (
    <AcceptLink
      slug={slug}
      endpoint="/v1/public/rsvp-links/accept"
      redirectTo={(resolvedSlug) => `/${resolvedSlug}#rsvp`}
      emptyLinkMessage="This RSVP link is missing its code. Ask your host to resend it."
    />
  );
}
