import Link from "next/link";
import type { ProductListing } from "@/data/types";
import { getProducts, getSellableListings } from "@/data/products";
import ProductCarousel from "@/components/home/ProductCarousel";

export const FEATURED_SLUGS = [
  "yellow-mustard-oil",
  "groundnut-oil",
  "black-sesame-oil",
  "khapli-wheat-atta",
  "sharbati-wheat-atta",
  "diabetic-care-atta",
  "multigrain-atta-channa-based",
  "ragi-finger-millet-flour",
];

const FEATURED_SPECS: Array<{ slug: string; targetSize: string }> = [
  { slug: "yellow-mustard-oil", targetSize: "1 L" },
  { slug: "groundnut-oil", targetSize: "1 L" },
  { slug: "black-sesame-oil", targetSize: "500 ML" },
  { slug: "khapli-wheat-atta", targetSize: "1 kg" },
  { slug: "sharbati-wheat-atta", targetSize: "1 kg" },
  { slug: "diabetic-care-atta", targetSize: "1 kg" },
  { slug: "multigrain-atta-channa-based", targetSize: "1 kg" },
  { slug: "ragi-finger-millet-flour", targetSize: "1 kg" },
];

const allListings = getSellableListings(getProducts());

const FEATURED: ProductListing[] = FEATURED_SPECS.flatMap(
  ({ slug, targetSize }) => {
    // 1. Try exact match by slug and variant size
    let match = allListings.find(
      (l) =>
        l.product.slug === slug &&
        l.variant.size.toLowerCase() === targetSize.toLowerCase(),
    );
    // 2. Fallback to any listing for that product slug
    if (!match) {
      match = allListings.find((l) => l.product.slug === slug);
    }
    return match ? [match] : [];
  },
);

export default function FeaturedProducts() {
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
          <ProductCarousel listings={FEATURED} ariaLabel="Featured products" />
        </div>
      </div>
    </section>
  );
}