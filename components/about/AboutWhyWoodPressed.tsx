import Image from "next/image";

interface AboutWhyWoodPressedProps {
  /** Earned product visual from the active catalog, distinct from the hero. */
  image: string | null;
}

const REASONS = [
  "The seeds are ground slowly in a traditional wooden press, letting each oil's natural character come through.",
  "No additives and no hurried extraction — a method built on time rather than shortcuts.",
  "The result is a single-ingredient oil made the traditional way, for the everyday Indian kitchen.",
];

/**
 * "Why Wood-Pressed Oils?" — editorial split explaining the brand's chosen
 * process. Copy is descriptive and factual; deliberately no health or medical
 * claims.
 */
export default function AboutWhyWoodPressed({ image }: AboutWhyWoodPressedProps) {
  return (
    <section
      aria-labelledby="why-wood-pressed-heading"
      className="border-b border-beige bg-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-sand/70 bg-cream/60 shadow-[0_36px_80px_-40px_rgba(21,41,30,0.6)] lg:aspect-[5/4]">
              <Image
                src={image || "/images/hero-visual.svg"}
                alt="Malmi wood-pressed oil from the active collection"
                width={1100}
                height={1100}
                unoptimized
                sizes="(min-width: 1024px) 44vw, 100vw"
                className="h-full w-full object-cover lg:h-auto"
              />
            </div>
            <span className="absolute -bottom-4 -right-4 -z-10 h-32 w-32 rounded-full bg-cream-deep/70" aria-hidden />
          </div>

          <div>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              Our Focus
            </p>
            <h2
              id="why-wood-pressed-heading"
              className="mt-4 font-display text-[2rem] font-semibold leading-tight tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              Why Wood-Pressed Oils?
            </h2>
            <p className="mt-6 text-base leading-relaxed text-earth-light sm:text-lg">
              Wood pressing is one of the slowest methods of extracting oil, and
              that is exactly why we reach for it.
            </p>
            <ul className="mt-6 space-y-3.5">
              {REASONS.map((reason) => (
                <li key={reason.slice(0, 24)} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                  />
                  <p className="text-[15px] leading-relaxed text-earth-light">
                    {reason}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}