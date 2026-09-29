import Image from "next/image";

const PARAGRAPHS = [
  "Malmi Lifestyle is built around one idea: everyday foods worth reaching for. We focus on single-ingredient products, thoughtfully selected for the Indian kitchen, then processed by slow, time-honoured methods instead of hurried shortcuts.",
  "Everything we make is quality-focused from seed to bottle and packed carefully for everyday use. There are no shortcuts here — just traditional food made to fit a modern way of living.",
  "The result is a small, focused collection we stand behind: everyday staples that begin with better ingredients and a more careful way of making them.",
];

/**
 * "Our Story" — editorial split with the brand's founding philosophy. Copy is
 * deliberately free of company history, farms, certifications and locations.
 */
export default function OurStory() {
  return (
    <section
      aria-labelledby="our-story-heading"
      className="border-b border-beige bg-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              Our Story
            </p>
            <h2
              id="our-story-heading"
              className="mt-4 font-display text-[2rem] font-semibold leading-tight tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              Food That Begins With Better Ingredients.
            </h2>
            <div className="mt-6 space-y-4 text-base leading-relaxed text-earth-light sm:text-lg">
              {PARAGRAPHS.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="overflow-hidden rounded-2xl border border-sand/70 bg-cream/60 shadow-[0_30px_70px_-38px_rgba(21,41,30,0.55)]">
              <Image
                src="/images/story-visual.svg"
                alt="Traditional Malmi Lifestyle food products and preparation"
                width={1000}
                height={1000}
                unoptimized
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="h-auto w-full"
              />
            </div>
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-4 -right-4 -z-10 h-28 w-28 rounded-full border border-beige bg-cream-deep/60"
            />
          </div>
        </div>
      </div>
    </section>
  );
}