import type { Metadata } from "next";
import ProductListingPage from "@/components/products/ProductListingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Multigrain Atta",
  description: "Stone-ground multigrain blends for everyday nutrition.",
};

export default function MultigrainAttaPage() {
  return <ProductListingPage category="multigrain-atta" />;
}