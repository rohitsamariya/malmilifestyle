import type { Metadata } from "next";
import AboutPage from "@/components/about/AboutPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn more about Malmi Lifestyle and our focus on thoughtfully selected food products and wood-pressed oils.",
};

export default function Page() {
  return <AboutPage />;
}