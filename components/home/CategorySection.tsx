import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { getProducts } from "@/data/products";
import type { ProductCategory } from "@/data/types";
import { ChevronRightIcon } from "@/components/ui/icons";
import { productsHref } from "@/lib/utils";
import { CATEGORY_BANNERS } from "@/components/home/categoryVisuals";

const CARDS = CATEGORIES.map((category) => ({
  ...category,
  count: getProducts().filter((p) => p.category === category.slug).length,
  image: CATEGORY_BANNERS[category.slug as ProductCategory],
}));

/**
 * "Explore Our Collections" — four large premium category cards.
 * Desktop 4 columns, tablet 2, mobile 1.
 */
export default function CategorySection() {
  return (
    <section aria-labelledby="collections-heading" className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            Shop By Category
          </p>
          <h2
            id="collections-heading"
            className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
          >
            Explore Our Collections
          </h2>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((category) => (
            <li key={category.slug}>
              <Link
                href={productsHref({ category: category.slug })}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-beige bg-white shadow-[0_8px_24px_-18px_rgba(21,41,30,0.35)] transition-all duration-200 hover:-translate-y-1 hover:border-earth-lighter hover:shadow-[0_18px_36px_-18px_rgba(31,59,44,0.4)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-cream-deep">
                  <Image
                    src={category.image}
                    alt={category.name}
                    width={1200}
                    height={800}
                    unoptimized
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  <span className="absolute right-3 top-3 rounded-full bg-cream/95 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest backdrop-blur-sm">
                    {category.count} products
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-2xl font-semibold text-forest">
                    {category.name}
                  </h3>
                  <p className="mt-2 flex-1 text-[15px] leading-relaxed text-earth-light">
                    {category.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-forest">
                    Explore Collection
                    <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}