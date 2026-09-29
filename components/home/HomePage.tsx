import Hero from "@/components/home/Hero";
import TrustStrip from "@/components/home/TrustStrip";
import FeaturedOils from "@/components/home/FeaturedOils";
import ChooseYourOil, { type OilCard } from "@/components/home/ChooseYourOil";
import WhyWoodPressed from "@/components/home/WhyWoodPressed";
import FromSeedToBottle from "@/components/home/FromSeedToBottle";
import ShopAllOils from "@/components/home/ShopAllOils";
import MalmiStory from "@/components/home/MalmiStory";
import FinalCta from "@/components/home/FinalCta";
import { getDbCategories } from "@/data/db-categories";
import { getDbAllListings, getDbProducts } from "@/data/db-products";
import type { Product, ProductListing } from "@/data/types";

export const dynamic = "force-dynamic";

/** How many variant listings the featured carousel shows. */
const FEATURED_LIMIT = 10;

function representativeImage(product: Product): string | null {
  const active = product.variants.filter((variant) => variant.isActive);
  return active.find((variant) => variant.image)?.image ?? active[0]?.image ?? null;
}

/**
 * Premium wood-pressed oil homepage.
 *
 * ## Data composition
 *
 * Everything visible comes from the active catalog — `getDbCategories()` and
 * `getDbProducts()` / `getDbAllListings()` all filter on `isActive` for the
 * category, the product and each variant. Nothing is hardcoded, so the page is
 * a wood-pressed oils page simply because that is the only active category
 * today. Deactivate it and the product sections disappear rather than showing
 * stale content; activate another category and it appears here automatically,
 * with the hero, "choose your oil" grid and CTAs following the first active
 * category.
 *
 * Section order:
 *   hero → trust strip → featured oils → choose your oil → why wood-pressed
 *   → from seed to bottle → shop all → malmi story → final CTA
 */
export default async function HomePage() {
  const [categories, products, allListings] = await Promise.all([
    getDbCategories(),
    getDbProducts(),
    getDbAllListings(),
  ]);

  // The primary active category drives the hero, section headings and CTAs.
  const primaryCategory = categories[0] ?? null;
  const primarySlug = primaryCategory?.slug ?? "wood-pressed-oils";

  // Restrict the catalogue sections to the primary category so the page reads
  // as one coherent collection rather than a mixed marketplace grid.
  const categoryProducts = products.filter(
    (product) => product.category === primarySlug || product.categorySlug === primarySlug,
  );
  const categoryListings = allListings.filter((listing) => {
    const { product } = listing;
    return product.category === primarySlug || product.categorySlug === primarySlug;
  });

  // Featured rail: the leading listing of every base oil, taken from the same
  // expanded set the grid below uses, so each card is a real sellable variant
  // and no oil is left out of the premium selection.
  const featuredListings = categoryProducts
    .map(
      (product) =>
        categoryListings.find(
          (listing) =>
            listing.product.id === product.id ||
            listing.product.slug === product.slug,
        ) ?? null,
    )
    .filter((listing): listing is ProductListing => listing !== null)
    .slice(0, FEATURED_LIMIT);

  // One editorial card per base product, with its active size count.
  const oils: OilCard[] = categoryProducts.map((product) => ({
    product,
    image: representativeImage(product),
    sizeCount: product.variants.filter((variant) => variant.isActive).length,
  }));

  const shopHref = `/products/${primarySlug}`;

  return (
    <>
      <Hero
        eyebrow={primaryCategory?.name ?? "Wood-Pressed Oils"}
        shopHref={shopHref}
        exploreHref={shopHref}
        exploreLabel="Explore Our Oils"
      />
      <TrustStrip />
      <FeaturedOils listings={featuredListings} />
      <ChooseYourOil oils={oils} />
      <WhyWoodPressed />
      <FromSeedToBottle />
      <ShopAllOils
        listings={categoryListings}
        categorySlug={primarySlug}
        categoryName={primaryCategory?.name ?? "Wood-Pressed Oils"}
      />
      <MalmiStory />
      <FinalCta shopHref={shopHref} />
    </>
  );
}
