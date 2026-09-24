import {
  DropletIcon,
  HeartIcon,
  LeafIcon,
  WheatIcon,
} from "@/components/ui/icons";

const FEATURES = [
  {
    icon: WheatIcon,
    title: "Traditional Processing",
    text: "Wood-pressed at low speeds and stone-ground on the chakki — the methods Indian kitchens have trusted for generations.",
  },
  {
    icon: LeafIcon,
    title: "Carefully Sourced Ingredients",
    text: "We begin with clean, naturally grown raw ingredients that are picked and checked with care before processing.",
  },
  {
    icon: DropletIcon,
    title: "Quality-Focused Products",
    text: "Every batch is watched over for purity, aroma and consistent everyday quality before it reaches your kitchen.",
  },
  {
    icon: HeartIcon,
    title: "Made For Everyday Living",
    text: "Honest food for daily rotis, dals, curries and family meals — simple, traditional and without compromise.",
  },
];

/** Editorial brand section — premium split layout, not a generic icon grid. */
export default function WhyMalmi() {
  return (
    <section
      id="why-malmi"
      aria-labelledby="whymalmi-heading"
      className="scroll-mt-24 bg-cream"
    >
      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-20 lg:px-8 lg:py-24">
        {/* Editorial intro */}
        <div className="lg:sticky lg:top-36 lg:self-start">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            Why Malmi
          </p>
          <h2
            id="whymalmi-heading"
            className="mt-4 font-display text-[2rem] font-semibold leading-tight tracking-tight text-forest sm:text-4xl lg:text-[2.75rem]"
          >
            Why Malmi Lifestyle?
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-forest/75">
            Because everyday food deserves the same care it always had — honest
            ingredients, patience and the traditional methods that give our
            food its true taste.
          </p>
          <p className="mt-6 border-l-2 border-gold pl-5 font-display text-xl italic leading-relaxed text-earth">
            &ldquo;Nothing rushed, nothing refined, nothing your grandmother
            would not recognise.&rdquo;
          </p>
        </div>

        {/* Features */}
        <ul className="grid gap-x-12 gap-y-12 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="border-t-2 border-gold pt-7">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-beige bg-white text-forest">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-forest">
                {title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-earth-light">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}