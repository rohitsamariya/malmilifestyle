import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getDbProductBySlug, getDbProducts } from "@/data/db-products";
import { getDbCategories, getDbCategory } from "@/data/db-categories";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import ProductListingPage from "@/components/products/ProductListingPage";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  const [products, categories] = await Promise.all([getDbProducts(), getDbCategories()]);
  const slugs = new Set([...products.map((product) => product.slug), ...categories.map((category) => category.slug)]);
  return Array.from(slugs, (slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getDbCategory(slug);
  if (category) {
    return {
      title: category.name,
      description: category.description,
    };
  }
  const product = await getDbProductBySlug(slug);
  return {
    title: product?.name,
    description: product?.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getDbCategory(slug);
  if (category) {
    return <ProductListingPage category={category.slug} />;
  }

  const product = await getDbProductBySlug(slug);
  if (!product) notFound();
  const productCategory = await getDbCategory(product.categorySlug || product.category);

  return (
    <Suspense fallback={null}>
      <ProductDetailClient product={product} category={productCategory} />
    </Suspense>
  );
}
