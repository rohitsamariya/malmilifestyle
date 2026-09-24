const STEPS = [
  {
    number: "01",
    title: "Carefully Selected",
    text: "Only clean, naturally grown raw ingredients that pass a careful check make the cut.",
  },
  {
    number: "02",
    title: "Traditionally Processed",
    text: "Wood-pressed and stone-ground the way Indian kitchens have always done it.",
  },
  {
    number: "03",
    title: "Quality Focused",
    text: "Every batch is watched over for purity, aroma and consistent everyday quality.",
  },
  {
    number: "04",
    title: "Carefully Packed",
    text: "Sealed and shipped with care so the freshness reaches your kitchen unhurried.",
  },
];

/** Quality / brand band — dark forest ground, large editorial typography. */
export default function QualityProcess() {
  return (
    <section
      aria-labelledby="quality-heading"
      className="bg-forest-deep text-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-soft">
            <span className="h-px w-9 bg-gold-soft" aria-hidden />
            Quality, Step By Step
          </p>
          <h2
            id="quality-heading"
            className="mt-4 font-display text-[2rem] font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem]"
          >
            Quality, The Malmi Way
          </h2>
        </div>

        <ol className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.number} className="border-t-2 border-gold-soft/45 pt-7">
              <span className="font-display text-6xl font-semibold text-gold-soft">
                {step.number}
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold">
                {step.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-cream/70">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}