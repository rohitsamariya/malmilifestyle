import Link from "next/link";
import { getDbFeaturedListings } from "@/data/db-products";
import ProductCarousel from "@/components/home/ProductCarousel";

export default async function FeaturedProducts() {
  const listings = await getDbFeaturedListings(8);

  return (
    <section
      aria-labelledby="featured-heading"
      className="border-y border-beige bg-cream-deep/50"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              From The Collection
            </p>
            <h2
              id="featured-heading"
              className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
            >
              Featured Products
            </h2>
            <p className="mt-3 text-base leading-relaxed text-earth-light">
              Everyday essentials, thoughtfully selected.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex h-11 items-center rounded-full border border-forest/25 bg-white px-6 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
          >
            View All Products
          </Link>
        </div>

        <div className="mt-12">
          <ProductCarousel listings={listings} ariaLabel="Featured products" />
        </div>
      </div>
    </section>
  );
}
