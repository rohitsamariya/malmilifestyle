import type { Metadata } from "next";
import ProductListingPage from "@/components/products/ProductListingPage";

export const metadata: Metadata = {
  title: "Wood-Pressed Oils",
  description:
    "Cold-pressed oils extracted the traditional way, without heat or chemicals.",
};

export default function WoodPressedOilsPage() {
  return <ProductListingPage category="wood-pressed-oils" />;
}