import {
  HeartIcon,
  LeafIcon,
  ShieldIcon,
  WheatIcon,
} from "@/components/ui/icons";

const TRUST_ITEMS = [
  {
    icon: LeafIcon,
    title: "Thoughtfully Sourced",
    text: "Every product is a single-ingredient, naturally sourced food.",
  },
  {
    icon: WheatIcon,
    title: "Traditional Processing",
    text: "Wood-pressed and stone-ground by slow, time-honoured methods.",
  },
  {
    icon: ShieldIcon,
    title: "Quality Focused",
    text: "Each batch is checked for purity and consistent everyday quality.",
  },
  {
    icon: HeartIcon,
    title: "Made With Care",
    text: "Sealed and packed carefully, ready for the everyday Indian kitchen.",
  },
];

/**
 * Homepage trust strip. Only verified, simple process claims are shown —
 * no certifications, logos or health claims.
 */
export default function TrustSection() {
  return (
    <section aria-label="Trust Malmi" className="border-y border-beige bg-cream-deep/50">
      <h2 className="sr-only">Why you can trust Malmi Lifestyle</h2>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        {TRUST_ITEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-beige bg-white text-forest">
              <Icon className="h-6 w-6" />
            </span>
            <h3 className="mt-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-forest">
              {title}
            </h3>
            <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-earth-light">
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}