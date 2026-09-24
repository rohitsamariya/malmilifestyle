import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducts } from "@/data/products";
import ProductDetailClient from "@/components/products/ProductDetailClient";

export const dynamicParams = true;

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProducts().find((p) => p.slug === slug);
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
  const product = getProducts().find((p) => p.slug === slug);
  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}