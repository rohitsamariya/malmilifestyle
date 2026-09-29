import AboutHero from "@/components/about/AboutHero";
import OurStory from "@/components/about/OurStory";
import WhatWeBelieve from "@/components/about/WhatWeBelieve";
import AboutWhyWoodPressed from "@/components/about/AboutWhyWoodPressed";
import AboutProcess from "@/components/about/AboutProcess";
import OurCurrentFocus from "@/components/about/OurCurrentFocus";
import AboutCta from "@/components/about/AboutCta";
import { getDbCategories } from "@/data/db-categories";
import { getDbAllListings, getDbProducts } from "@/data/db-products";
import type { ProductListing } from "@/data/types";

/**
 * Editorial About page for Malmi Lifestyle.
 *
 * Data composition mirrors the homepage: everything comes from the active
 * catalog. The Our Current Focus card derives its counts ("X oils in multiple
 * pack sizes") from the live database rather than hardcoding them, and all
 * CTAs point at the active category's listing.
 *
 * Deliberately no company history, founding year, farms, factories,
 * certifications, awards, manufacturing locations or health claims — none of
 * that content exists for the brand.
 */
export default async function AboutPage() {
  const [categories, products, allListings] = await Promise.all([
    getDbCategories(),
    getDbProducts(),
    getDbAllListings(),
  ]);

  const primaryCategory = categories[0] ?? null;
  const primarySlug = primaryCategory?.slug ?? "wood-pressed-oils";
  const shopHref = `/products/${primarySlug}`;

  const categoryProducts = products.filter(
    (product) => product.category === primarySlug || product.categorySlug === primarySlug,
  );
  const categoryListings = allListings.filter((listing) => {
    const { product } = listing;
    return product.category === primarySlug || product.categorySlug === primarySlug;
  });

  // First catalog visual — base reference for the split-section image below.
  const heroImage: string | null =
    categoryListings.find((listing: ProductListing) => listing.variant.image)?.variant.image ??
    null;

  // A second, distinct visual for the split section, so no image repeats.
  const whyPressImage: string | null =
    categoryListings.find(
      (listing: ProductListing) =>
        listing.variant.image && listing.variant.image !== heroImage,
    )?.variant.image ?? heroImage;

  const distinctSizes = new Set(
    categoryListings.map((listing) => listing.variant.size).filter(Boolean),
  );
  const packSizeCount = distinctSizes.size;

  return (
    <>
      <AboutHero shopHref={shopHref} />
      <OurStory />
      <WhatWeBelieve />
      <AboutWhyWoodPressed image={whyPressImage} />
      <AboutProcess />
      <OurCurrentFocus
        productCount={categoryProducts.length}
        packSizeCount={packSizeCount}
        shopHref={shopHref}
      />
      <AboutCta shopHref={shopHref} />
    </>
  );
}