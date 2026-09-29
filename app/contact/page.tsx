import type { Metadata } from "next";
import ContactPage from "@/components/contact/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Malmi Lifestyle. Find our address and contact information.",
};

export default function Page() {
  return <ContactPage />;
}