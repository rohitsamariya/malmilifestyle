import {
  DropletIcon,
  LeafIcon,
  ShieldIcon,
  WheatIcon,
} from "@/components/ui/icons";

const BENEFITS = [
  {
    icon: WheatIcon,
    title: "Traditional Processing",
    text: "Wood-pressed and stone-ground by slow, time-honoured methods rather than hurried shortcuts.",
  },
  {
    icon: LeafIcon,
    title: "Carefully Selected Ingredients",
    text: "Every product is a single-ingredient, naturally sourced food.",
  },
  {
    icon: ShieldIcon,
    title: "Quality Focused",
    text: "Each batch is checked for purity and consistent everyday quality.",
  },
  {
    icon: DropletIcon,
    title: "Thoughtfully Packed",
    text: "Sealed and packed carefully, ready for the everyday Indian kitchen.",
  },
];

/**
 * Editorial explanation of the wood-pressed process.
 *
 * Restricted to process, sourcing and packaging claims that the existing brand
 * copy supports. No medical, nutritional or certification claims.
 */
export default function WhyWoodPressed() {
  return (
    <section
      id="why-malmi"
      aria-labelledby="why-wood-pressed-heading"
      className="border-b border-beige bg-cream-deep/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            Our Approach
          </p>
          <h2
            id="why-wood-pressed-heading"
            className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
          >
            Why Wood-Pressed?
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-beige bg-beige sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex h-full flex-col bg-white p-7 lg:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-beige bg-cream text-forest">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-forest">
                {title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-earth-light">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
