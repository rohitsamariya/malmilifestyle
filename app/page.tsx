import type { Metadata } from "next";
import HomePage from "@/components/home/HomePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "Malmi Lifestyle | Pure, Natural & Traditional Foods",
  },
  description:
    "Wood-pressed oils and stone-ground flours, made the traditional way. Explore Malmi Lifestyle's carefully sourced natural foods.",
};

export default function Page() {
  return <HomePage />;
}