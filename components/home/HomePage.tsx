import Hero from "@/components/home/Hero";
import Benefits from "@/components/home/Benefits";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import WhyMalmi from "@/components/home/WhyMalmi";
import BrandStory from "@/components/home/BrandStory";
import ProductCategorySection from "@/components/home/ProductCategorySection";
import QualityProcess from "@/components/home/QualityProcess";
import ExploreMore from "@/components/home/ExploreMore";
import CustomerStories from "@/components/home/CustomerStories";
import TrustSection from "@/components/home/TrustSection";
import { getDbCategories } from "@/data/db-categories";
import { getDbAllListings, getDbProducts } from "@/data/db-products";
import { getDbCatalogStats, toHomepageStats } from "@/data/db-catalog-stats";
import { getCategoryBanner } from "@/components/home/categoryVisuals";

export const dynamic = "force-dynamic";

const FEATURED_LIMIT = 8;

export default async function HomePage() {
  const [allProducts, categories, allListings, catalogStats] = await Promise.all([
    getDbProducts(),
    getDbCategories(),
    getDbAllListings(),
    getDbCatalogStats(),
  ]);

  // One read, split once: the featured rail and the "Explore More" rail are
  // disjoint slices of the same list, so a product can never appear in both.
  const featuredListings = allListings.slice(0, FEATURED_LIMIT);
  const exploreListings = allListings.slice(FEATURED_LIMIT);

  // A category with no active products is skipped entirely rather than
  // rendering an empty band on the homepage.
  const categorySections = categories
    .map((category) => ({
      category,
      products: allProducts.filter((product) => product.category === category.slug),
      banner: getCategoryBanner(category),
    }))
    .filter((section) => section.products.length > 0);

  return (
    <>
      <Hero stats={toHomepageStats(catalogStats)} />
      <Benefits />
      <CategorySection categories={categories} products={allProducts} />
      <FeaturedProducts listings={featuredListings} />
      <WhyMalmi />
      <BrandStory />
      {categorySections.map((section, index) => (
        <ProductCategorySection
          key={section.category.slug}
          {...section}
          tone={index % 2 === 0 ? "light" : "default"}
        />
      ))}
      <QualityProcess />
      <ExploreMore listings={exploreListings} />
      <CustomerStories />
      <TrustSection />
    </>
  );
}
