import { ChevronRightIcon } from "@/components/ui/icons";

const STEPS = [
  {
    number: "01",
    title: "Selected Ingredients",
    text: "Single-ingredient foods, naturally sourced for everyday cooking.",
  },
  {
    number: "02",
    title: "Traditional Processing",
    text: "Wood-pressed by slow, time-honoured methods.",
  },
  {
    number: "03",
    title: "Quality Focus",
    text: "Every batch checked for consistent everyday quality.",
  },
  {
    number: "04",
    title: "Carefully Packed",
    text: "Sealed with care and ready for your kitchen.",
  },
];

/**
 * "Our Process" — a simple visual flow of how a product comes to life, from
 * seed to bottle. Horizontal on desktop, stacked on mobile. Claims stay
 * limited to what the brand copy supports.
 */
export default function AboutProcess() {
  return (
    <section
      aria-labelledby="about-process-heading"
      className="border-b border-beige bg-cream-deep/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            Our Process
          </p>
          <h2
            id="about-process-heading"
            className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
          >
            From Seed to Bottle
          </h2>
        </div>

        <ol className="mt-12 grid gap-10 lg:grid-cols-4 lg:gap-0">
          {STEPS.map((step, index) => {
            const isLast = index === STEPS.length - 1;
            return (
              <li key={step.number} className="relative flex flex-col justify-between">
                <div>
                  <span className="font-display text-4xl font-semibold leading-none text-gold/70 lg:text-5xl">
                    {step.number}
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold text-forest">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-earth-light">
                    {step.text}
                  </p>
                </div>

                {!isLast && (
                  <>
                    <span
                      aria-hidden
                      className="mt-6 h-8 w-px border-l-2 border-dotted border-sand lg:hidden"
                    />
                    <ChevronRightIcon
                      aria-hidden
                      className="absolute -left-3 top-6 hidden h-5 w-5 text-sand lg:block"
                    />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}