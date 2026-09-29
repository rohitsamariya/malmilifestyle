import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

/**
 * Editorial brand split. Deliberately generic about provenance: no founding
 * dates, farm claims, certifications or manufacturing locations, none of which
 * are established in the existing brand content.
 */
export default function MalmiStory() {
  return (
    <section
      id="about"
      aria-labelledby="malmi-story-heading"
      className="border-b border-beige bg-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-2xl border border-sand/70 bg-cream/60 shadow-[0_30px_70px_-38px_rgba(21,41,30,0.55)]">
              <Image
                src="/images/malmi-story.png"
                alt="Traditional Malmi Lifestyle oil preparation"
                width={1145}
                height={1374}
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

          <div className="order-1 max-w-xl lg:order-2">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              The Malmi Story
            </p>
            <h2
              id="malmi-story-heading"
              className="mt-4 font-display text-[2rem] font-semibold leading-tight tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              From Carefully Chosen Ingredients
              <br className="hidden sm:block" /> to Your Kitchen
            </h2>
            <p className="mt-6 text-base leading-relaxed text-earth-light">
              Malmi Lifestyle makes everyday staples the traditional way —
              single-ingredient foods, wood-pressed and stone-ground by slow,
              time-honoured methods, then carefully packed for the everyday
              Indian kitchen.
            </p>

            <Link
              href="/about"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-forest/25 bg-white px-7 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
            >
              Learn More
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
