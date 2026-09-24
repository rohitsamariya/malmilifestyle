import type { Metadata } from "next";
import ProductListingPage from "@/components/products/ProductListingPage";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Explore the complete Malmi Lifestyle collection — wood-pressed oils and stone-ground flours, made the traditional way.",
};

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  // Support both ?search= (new SearchBar) and legacy ?q=
  const query =
    typeof params["search"] === "string"
      ? params["search"]
      : typeof params["q"] === "string"
        ? params["q"]
        : undefined;
  return <ProductListingPage category="all" query={query} />;
}