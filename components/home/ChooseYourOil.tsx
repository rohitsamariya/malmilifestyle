import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { Product } from "@/data/types";

export interface OilCard {
  product: Product;
  /** Representative image, taken from an active variant. */
  image: string | null;
  /** How many active sizes this base oil is sold in. */
  sizeCount: number;
}

/**
 * "Explore Our Products" — one editorial card per BASE product, not per variant.
 * Sizes are summarised as a count; picking an oil goes to its PDP where the
 * 500 ML / 1 L / 5 L selector lives.
 */
export default function ChooseYourOil({ oils }: { oils: OilCard[] }) {
  if (oils.length === 0) return null;

  return (
    <section
      aria-labelledby="choose-your-oil-heading"
      className="border-b border-beige bg-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            Find Your Oil
          </p>
          <h2
            id="choose-your-oil-heading"
            className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
          >
            Explore Our Products
          </h2>
          <p className="mt-3 text-base leading-relaxed text-earth-light">
            Discover our collection and find the right product for your everyday
            needs.
          </p>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-10">
          {oils.map(({ product, image, sizeCount }) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-beige bg-white transition-all duration-300 hover:-translate-y-1 hover:border-earth-lighter hover:shadow-[0_24px_48px_-24px_rgba(31,59,44,0.45)]"
              >
                <div className="relative aspect-square overflow-hidden bg-cream-deep">
                  <Image
                    src={image || "/images/hero-visual.svg"}
                    alt={product.name}
                    width={600}
                    height={600}
                    unoptimized
                    sizes="(min-width: 1024px) 24vw, (min-width: 640px) 33vw, 50vw"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                </div>

                <div className="flex flex-1 flex-col p-4 lg:p-5">
                  <h3 className="font-display text-base font-semibold leading-snug text-forest lg:text-lg">
                    {product.name}
                  </h3>
                  <p className="mt-1.5 text-[12px] font-medium text-earth">
                    {sizeCount} {sizeCount === 1 ? "size" : "sizes"} available
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1.5 self-start border-b border-forest/25 pb-0.5 text-[13px] font-semibold text-forest transition-colors group-hover:border-forest">
                    Explore
                    <ChevronRightIcon className="h-3.5 w-3.5" />
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
