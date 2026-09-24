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
import { CATEGORY_BANNERS } from "@/components/home/categoryVisuals";
import { CATEGORIES } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import type { ProductCategory } from "@/data/types";

const SECTION_ORDER: ProductCategory[] = [
  "wood-pressed-oils",
  "wheat-atta",
  "multigrain-atta",
  "millet-atta",
];

/**
 * Long-form premium Malmi homepage — a separate experience from the dedicated
 * `/products` catalog, with which it shares every product card. Pure server
 * component; all catalog browsing happens on `/products`.
 */
export default function HomePage() {
  const categorySections = SECTION_ORDER.map((slug) => ({
    category: CATEGORIES.find((c) => c.slug === slug)!,
    products: getProductsByCategory(slug),
    banner: CATEGORY_BANNERS[slug],
  }));

  return (
    <>
      <Hero />
      <Benefits />
      <CategorySection />
      <FeaturedProducts />
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
      <ExploreMore />
      <CustomerStories />
      <TrustSection />
    </>
  );
}