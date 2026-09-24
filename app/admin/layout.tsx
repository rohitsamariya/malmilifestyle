import type { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: {
    default: "Admin Portal | Malmi Lifestyle",
    template: "%s | Malmi Admin",
  },
  description: "Management dashboard for Malmi Lifestyle ecommerce store.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
