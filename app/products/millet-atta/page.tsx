import type { Metadata } from "next";
import ProductListingPage from "@/components/products/ProductListingPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Millet Atta",
  description: "Stone-ground millet and traditional flours.",
};

export default function MilletAttaPage() {
  return <ProductListingPage category="millet-atta" />;
}