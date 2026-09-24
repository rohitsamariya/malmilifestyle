const PLACEHOLDER_CARDS = [
  {
    quote:
      "A real customer story will live here once we begin shipping — this is structured placeholder content only.",
    name: "Customer",
    detail: "Review coming soon",
  },
  {
    quote:
      "A real customer story will live here once we begin shipping — this is structured placeholder content only.",
    name: "Customer",
    detail: "Review coming soon",
  },
  {
    quote:
      "A real customer story will live here once we begin shipping — this is structured placeholder content only.",
    name: "Customer",
    detail: "Review coming soon",
  },
];

/**
 * Testimonial section structure. Real reviews are not available yet, so the
 * cards are clearly marked as placeholders to be replaced later. No invented
 * testimonials are presented as real customers.
 */
export default function CustomerStories() {
  return (
    <section
      aria-labelledby="stories-heading"
      className="bg-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-8 bg-gold" aria-hidden />
              Testimonials
            </p>
            <h2
              id="stories-heading"
              className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              Customer Stories
            </h2>
            <p className="mt-3 text-base leading-relaxed text-earth-light">
              The section is ready — real reviews will appear here as soon as
              our first customers share them.
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-dashed border-sand bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-earth">
            Placeholder Content
          </span>
        </div>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_CARDS.map((card, index) => (
            <li
              key={index}
              className="flex h-full flex-col rounded-xl border border-dashed border-sand bg-white p-6"
            >
              <span
                aria-hidden
                className="font-display text-5xl leading-none text-sand"
              >
                &ldquo;
              </span>
              <p className="mt-2 flex-1 text-sm italic leading-relaxed text-forest/75">
                {card.quote}
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-beige pt-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-beige text-sm font-semibold text-earth">
                  ?
                </span>
                <div>
                  <p className="text-sm font-semibold text-forest">{card.name}</p>
                  <p className="text-xs text-earth-light">{card.detail}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}