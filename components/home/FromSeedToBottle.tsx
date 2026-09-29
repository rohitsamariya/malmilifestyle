const STEPS = [
  {
    number: "01",
    title: "Selected Ingredients",
    text: "Single-ingredient, naturally sourced foods are chosen for everyday cooking.",
  },
  {
    number: "02",
    title: "Traditional Processing",
    text: "Wood-pressed and stone-ground by slow, time-honoured methods.",
  },
  {
    number: "03",
    title: "Quality Focused",
    text: "Each batch is checked for purity and consistent everyday quality.",
  },
  {
    number: "04",
    title: "Carefully Packed",
    text: "Sealed and packed carefully, ready for your kitchen.",
  },
];

/**
 * "From Seed to Bottle" — four-step horizontal timeline on desktop, stacked on
 * mobile. Describes our process only; makes no sourcing, facility or
 * manufacturing claims we cannot substantiate.
 */
export default function FromSeedToBottle() {
  return (
    <section
      aria-labelledby="seed-to-bottle-heading"
      className="border-b border-beige bg-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            How We Work
          </p>
          <h2
            id="seed-to-bottle-heading"
            className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
          >
            From Seed to Bottle
          </h2>
        </div>

        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step) => (
            <li key={step.number} className="relative flex flex-col">
              {/* Connector — desktop only, sits on the rule above the content */}
              <span
                aria-hidden
                className="mb-7 hidden h-px w-full bg-beige lg:block"
              />
              <span className="font-display text-4xl font-semibold leading-none text-gold/70 lg:text-5xl">
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-forest">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-earth-light">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
