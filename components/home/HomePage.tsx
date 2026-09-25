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
import { getDbProducts } from "@/data/db-products";
import { getCategoryBanner } from "@/components/home/categoryVisuals";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [allProducts, categories] = await Promise.all([
    getDbProducts(),
    getDbCategories(),
  ]);
  const categorySections = categories.map((category) => ({
    category,
    products: allProducts.filter((product) => product.category === category.slug),
    banner: getCategoryBanner(category),
  }));

  return (
    <>
      <Hero />
      <Benefits />
      <CategorySection categories={categories} products={allProducts} />
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
