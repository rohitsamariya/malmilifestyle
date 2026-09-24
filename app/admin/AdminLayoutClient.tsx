"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on /admin/login, render login page directly without Admin sidebar/header frame
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-cream/60">{children}</div>;
  }

  // Determine page title for header
  let pageTitle = "Dashboard";
  if (pathname.startsWith("/admin/products")) pageTitle = "Products";
  else if (pathname.startsWith("/admin/categories")) pageTitle = "Categories";
  else if (pathname.startsWith("/admin/orders")) pageTitle = "Orders";
  else if (pathname.startsWith("/admin/customers")) pageTitle = "Customers";
  else if (pathname.startsWith("/admin/settings")) pageTitle = "Settings";

  return (
    <div className="flex min-h-screen bg-cream/40">
      <AdminSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <AdminHeader onMobileMenuToggle={() => setMobileOpen((v) => !v)} pageTitle={pageTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
