import type { Metadata } from "next";
import ProductListingPage from "@/components/products/ProductListingPage";

export const metadata: Metadata = {
  title: "Wheat Atta",
  description: "Stone-ground wheat flours, milled the traditional way.",
};

export default function WheatAttaPage() {
  return <ProductListingPage category="wheat-atta" />;
}