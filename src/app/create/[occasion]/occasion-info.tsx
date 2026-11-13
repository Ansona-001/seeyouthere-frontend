import { JsonLd } from "@/components/json-ld";

type Faq = { q: string; a: string };

type OccasionSeo = {
  /** Page <title> (the site name is appended by the layout template). */
  title: string;
  description: string;
  /** Section heading and intro shown under the wizard. */
  heading: string;
  intro: string;
  points: readonly { title: string; body: string }[];
  /** Occasion-specific questions; the shared ones below are appended. */
  faqs: readonly Faq[];
};

const sharedFaqs = (noun: string): Faq[] => [
  {
    q: `Is it free to create a ${noun} invitation?`,
    a: "Yes. You can design, publish and share an invitation with any free design at no cost. Premium designs are optional and are unlocked per event.",
  },
  {
    q: "Do my guests need an account to RSVP?",
    a: "No. Guests open your link, tap RSVP and answer in under a minute, with no sign-up or app to install.",
  },
  {
    q: "How do I share my invitation?",
    a: "You get one link to send by message, email or WhatsApp. You can also add guests individually and see who has replied.",
  },
];

const pointsFor = (noun: string) =>
  [
    {
      title: "Designed to look the part",
      body: `Pick a ${noun} design, then change the palette and fonts until it feels like yours.`,
    },
    {
      title: "RSVPs in one place",
      body: "Guests reply from the link. You see every answer, headcount and note on your dashboard instead of chasing messages.",
    },
    {
      title: "One link, any device",
      body: "Your invitation page works on any phone or computer and needs nothing installed.",
    },
  ] as const;

// Keyed by occasion slug (mirrors the occasions seeded in the API). An unknown slug simply gets no extra section.
const SEO: Record<string, OccasionSeo> = {
  wedding: {
    title: "Free wedding invitation website with RSVP",
    description:
      "Create a free wedding invitation website with online RSVP. Choose a design, add your details and share one link with your guests.",
    heading: "A free wedding invitation website with RSVP",
    intro:
      "Share the day, the details and the RSVP in one beautiful page. Add your venue, schedule and story, then send a single link. Guests reply online and you see who is coming.",
    points: pointsFor("wedding"),
    faqs: [
      {
        q: "What can I put on a wedding invitation page?",
        a: "The date, venue with a map, schedule, your story, a photo, dress code and an RSVP form. You choose which sections to show.",
      },
      {
        q: "Can I also send a save the date?",
        a: "Yes. Publish the page early with the date and a note, then update it with the full details when they are ready.",
      },
    ],
  },
  engagement: {
    title: "Free engagement party invitation with RSVP",
    description: "Create a free engagement party invitation with online RSVP and share it with one link.",
    heading: "Free engagement invitations with RSVP",
    intro: "Tell everyone properly. Set up the party details, share one link and see who can celebrate with you.",
    points: pointsFor("engagement"),
    faqs: [],
  },
  birthday: {
    title: "Free birthday invitation with RSVP",
    description: "Create a free online birthday invitation with RSVP. Pick a design and share one link with your guests.",
    heading: "Free online birthday invitations with RSVP",
    intro:
      "From a first birthday to a fiftieth, put the time, place and plans on one page and let guests reply with a tap.",
    points: pointsFor("birthday"),
    faqs: [],
  },
  "baby-shower": {
    title: "Free baby shower invitation with RSVP",
    description: "Create a free baby shower invitation with online RSVP and share it with one link.",
    heading: "Free baby shower invitations with RSVP",
    intro: "Soft, sweet and simple. Add the date and place, share a link, and keep track of who is coming.",
    points: pointsFor("baby shower"),
    faqs: [],
  },
  housewarming: {
    title: "Free housewarming invitation with RSVP",
    description: "Create a free housewarming invitation with online RSVP and share it with one link.",
    heading: "Free housewarming invitations with RSVP",
    intro: "New keys, open doors. Share the address, time and a note, and let friends and family reply online.",
    points: pointsFor("housewarming"),
    faqs: [],
  },
  party: {
    title: "Free party invitation with RSVP",
    description: "Create a free party invitation with online RSVP. Pick a design and share one link.",
    heading: "Free party invitations with RSVP",
    intro: "Milestones and late nights. Put the details on one page, share the link, and see who is coming.",
    points: pointsFor("party"),
    faqs: [],
  },
};

/** Title/description for the occasion page's metadata, or undefined for an unknown slug. */
export function occasionSeo(slug: string): Pick<OccasionSeo, "title" | "description"> | undefined {
  return Object.hasOwn(SEO, slug) ? SEO[slug] : undefined;
}

/** Crawlable explainer and FAQ under the setup wizard, plus FAQPage structured data. Server-rendered, no client JS. */
export function OccasionInfo({ slug }: { slug: string }) {
  const seo = Object.hasOwn(SEO, slug) ? SEO[slug] : undefined;
  if (!seo) return null;
  const faqs = [...seo.faqs, ...sharedFaqs(slug.replace(/-/g, " "))];

  return (
    <section aria-labelledby="occasion-info-heading" className="mx-auto w-full max-w-3xl border-t pt-10">
      <h2 id="occasion-info-heading" className="font-heading text-3xl text-brand-heading">
        {seo.heading}
      </h2>
      <p className="mt-3 text-lg text-muted-foreground">{seo.intro}</p>

      <ul className="mt-8 grid gap-6 sm:grid-cols-3">
        {seo.points.map((p) => (
          <li key={p.title}>
            <h3 className="font-medium">{p.title}</h3>
            <p className="mt-1 text-muted-foreground">{p.body}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 font-heading text-2xl text-brand-heading">Frequently asked questions</h2>
      <dl className="mt-4 divide-y">
        {faqs.map((f) => (
          <div key={f.q} className="py-4">
            <dt className="font-medium">{f.q}</dt>
            <dd className="mt-1 text-muted-foreground">{f.a}</dd>
          </div>
        ))}
      </dl>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
    </section>
  );
}
