"use client";

import { use } from "react";

import { AcceptLink } from "../accept-link";

export default function InvitePage({ params }: PageProps<"/[slug]/invite">) {
  const { slug } = use(params);

  return (
    <AcceptLink
      slug={slug}
      endpoint="/v1/public/invites/accept"
      redirectTo={(resolvedSlug) => `/${resolvedSlug}`}
      emptyLinkMessage="This invite link is missing its code. Ask your host to resend it."
    />
  );
}
