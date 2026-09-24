"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MenuIcon } from "@/components/ui/icons";

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
  pageTitle?: string;
}

export default function AdminHeader({
  onMobileMenuToggle,
  pageTitle = "Dashboard",
}: AdminHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-beige bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          aria-label="Toggle admin menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-beige text-forest transition-colors hover:bg-cream lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-bold text-forest sm:text-xl">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Admin identity badge */}
        <div className="hidden items-center gap-2 rounded-full border border-beige bg-cream px-3 py-1 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          <span className="text-xs font-semibold text-forest">Admin</span>
        </div>

        {/* Header logout button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-forest/20 px-3 text-xs font-bold uppercase tracking-wider text-forest transition-colors hover:bg-forest hover:text-cream disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}
