import {
  DropletIcon,
  LeafIcon,
  ShieldIcon,
  WheatIcon,
  HeartIcon,
} from "@/components/ui/icons";

const USP_ITEMS = [
  {
    icon: WheatIcon,
    title: "Traditional Processing",
    text: "Wood-pressed and stone-ground by slow, time-honoured methods.",
  },
  {
    icon: LeafIcon,
    title: "Carefully Selected Ingredients",
    text: "Every product is a single-ingredient, naturally sourced food.",
  },
  {
    icon: ShieldIcon,
    title: "Quality Focused Products",
    text: "Each batch is checked for purity and consistent everyday quality.",
  },
  {
    icon: DropletIcon,
    title: "Freshly Packed",
    text: "Sealed and packed carefully, ready for the everyday Indian kitchen.",
  },
  {
    icon: HeartIcon,
    title: "Made for Everyday Living",
    text: "Simple, honest ingredients for daily cooking at home.",
  },
];

/**
 * Compact trust / USP strip directly below the hero.
 *
 * Process and packaging statements only — no certifications, ratings or
 * health claims, none of which we can substantiate.
 */
export default function TrustStrip() {
  return (
    <section
      aria-label="Why choose Malmi"
      className="border-b border-beige bg-cream-deep/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
          {USP_ITEMS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-beige bg-white text-forest">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3.5 text-[13px] font-semibold uppercase tracking-[0.1em] text-forest">
                {title}
              </h3>
              <p className="mt-2 max-w-[15rem] text-[13px] leading-relaxed text-earth-light">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
