import Image from "next/image";
import Link from "next/link";

/** Large editorial brand-story section: image + philosophy copy. */
export default function BrandStory() {
  return (
    <section
      id="about"
      aria-labelledby="story-heading"
      className="scroll-mt-24 border-y border-beige bg-cream-deep/50"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:py-24">
        {/* Visual */}
        <div className="relative order-2 lg:order-1">
          <div className="overflow-hidden rounded-2xl border border-sand/70 bg-cream shadow-[0_30px_70px_-34px_rgba(31,59,44,0.5)]">
            <Image
              src="/images/story-visual.svg"
              alt="Traditional Malmi still life — grains, flour and a wooden bowl"
              width={900}
              height={1080}
              unoptimized
              className="h-auto w-full"
            />
          </div>
          <div className="absolute -bottom-4 left-3 rounded-full border border-beige bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-forest shadow-[0_8px_20px_-8px_rgba(31,59,44,0.35)] sm:left-5">
            Traditionally Made
          </div>
        </div>

        {/* Copy */}
        <div className="order-1 lg:order-2">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            Our Philosophy
          </p>
          <h2
            id="story-heading"
            className="mt-4 font-display text-[2rem] font-semibold leading-tight tracking-tight text-forest sm:text-4xl lg:text-[2.75rem]"
          >
            From Carefully Chosen Ingredients To Your Kitchen
          </h2>
          <p className="mt-6 text-base leading-relaxed text-forest/80 lg:text-lg">
            Malmi Lifestyle begins with the raw ingredient. We choose clean,
            naturally grown produce, then trust it to methods that have served
            Indian kitchens for generations.
          </p>
          <p className="mt-4 text-base leading-relaxed text-forest/80 lg:text-lg">
            Wood-pressed mustards and groundnut oils, stone-ground wheat and
            millet flours — pressed slowly, milled gently and packed with care.
            None of it is rushed, none of it refined away.
          </p>
          <div className="mt-9">
            <Link
              href="/products"
              className="inline-flex h-[52px] items-center rounded-full bg-forest px-8 text-[15px] font-semibold text-cream transition-colors hover:bg-forest-soft"
            >
              Discover Malmi
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}