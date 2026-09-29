import { LeafIcon, WheatIcon, ShieldIcon, DropletIcon } from "@/components/ui/icons";

const VALUES = [
  {
    number: "01",
    icon: LeafIcon,
    title: "Thoughtfully Selected",
    text: "Single-ingredient foods, naturally sourced and picked for everyday cooking.",
  },
  {
    number: "02",
    icon: WheatIcon,
    title: "Traditional Processing",
    text: "Traditional processing methods remain central to how we approach our products.",
  },
  {
    number: "03",
    icon: ShieldIcon,
    title: "Quality Focused",
    text: "We focus on consistency, care, and quality throughout the product journey.",
  },
  {
    number: "04",
    icon: DropletIcon,
    title: "Carefully Packed",
    text: "Products are carefully packed for everyday use in the kitchen.",
  },
];

/**
 * "What We Believe" — the four principles behind every product. Copy stays
 * limited to sourcing, process and packaging; no certifications, awards or
 * health claims.
 */
export default function WhatWeBelieve() {
  return (
    <section
      aria-labelledby="what-we-believe-heading"
      className="border-b border-beige bg-cream-deep/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            What We Believe
          </p>
          <h2
            id="what-we-believe-heading"
            className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
          >
            Simple Principles. Thoughtful Choices.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-beige bg-beige sm:grid-cols-2">
          {VALUES.map(({ number, icon: Icon, title, text }) => (
            <div key={number} className="flex h-full flex-col bg-white p-7 lg:p-9">
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl font-semibold leading-none tracking-tight text-gold lg:text-3xl">
                  {number}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-beige bg-cream text-forest">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <h3 className="mt-6 font-display text-lg font-semibold text-forest">
                {title}
              </h3>
              <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-earth-light">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}