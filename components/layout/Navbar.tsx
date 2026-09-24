"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/data/categories";
import SearchBar from "@/components/products/SearchBar";
import CartDrawer from "@/components/cart/CartDrawer";
import {
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { useCart } from "@/lib/cartContext";
import { cn, productsHref } from "@/lib/utils";

function activeFromPath(pathname: string): string {
  if (pathname === "/products" || pathname === "/products/") return "all";
  if (pathname.startsWith("/products/")) {
    const segment = pathname.split("/")[2] ?? "";
    return CATEGORIES.some((c) => c.slug === segment) ? segment : "";
  }
  return "";
}

/** Small icon button used for Profile and Cart in the navbar. */
function IconBtn({
  onClick,
  href,
  label,
  badge,
  isActive,
  children,
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  badge?: number;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  const cls = cn(
    "relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150",
    isActive
      ? "bg-forest text-cream shadow-sm hover:bg-forest/90"
      : "text-forest hover:bg-beige",
  );
  const inner = (
    <>
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest px-1 text-[9px] font-black text-cream">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-label={label} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cls}>
      {inner}
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  // Hide customer Navbar on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const activeCategory = activeFromPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { cartCount } = useCart();

  const categoryLink = (slug: string) =>
    productsHref({ category: slug === "all" ? undefined : slug });

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-beige bg-cream/95 backdrop-blur-sm">
        {/* Top strip */}
        <div className="bg-forest text-center text-[11px] font-medium uppercase tracking-[0.2em] text-cream">
          <p className="px-4 py-2">Pure Ingredients &bull; Traditional Processing &bull; Trusted Quality</p>
        </div>

        {/* Main bar */}
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:h-[72px] lg:px-8">

          {/* Mobile hamburger */}
          <button
            type="button"
            className="-ml-1 mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-forest transition-colors hover:bg-beige lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 flex-col leading-none"
            aria-label="Malmi Lifestyle home"
            onClick={() => setMenuOpen(false)}
          >
            <span className="font-display text-lg font-semibold tracking-[0.28em] text-forest lg:text-xl">
              MALMI
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.5em] text-earth">
              Lifestyle
            </span>
          </Link>

          {/* Desktop category nav — centred */}
          <nav
            aria-label="Categories"
            className="mx-6 hidden flex-1 items-center justify-center gap-0.5 lg:flex xl:mx-10"
          >
            <Link
              href="/products"
              className={cn(
                "whitespace-nowrap px-3 py-1.5 text-[14px] font-medium text-forest/70 transition-colors hover:text-forest",
                activeCategory === "all"
                  ? "border-b-2 border-forest font-semibold text-forest"
                  : "border-b-2 border-transparent",
              )}
              aria-current={activeCategory === "all" ? "page" : undefined}
            >
              All Products
            </Link>
            {CATEGORIES.map((category) => {
              const isActive = activeCategory === category.slug;
              return (
                <Link
                  key={category.slug}
                  href={categoryLink(category.slug)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 text-[14px] font-medium text-forest/70 transition-colors hover:text-forest",
                    isActive
                      ? "border-b-2 border-forest font-semibold text-forest"
                      : "border-b-2 border-transparent",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {category.name}
                </Link>
              );
            })}
          </nav>

          {/* Right actions: Search | Profile | Cart — all in the exact same row */}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {searchOpen ? (
              <div className="flex items-center gap-2 transition-all duration-200 w-56 sm:w-72 md:w-80 lg:w-96">
                <div className="flex-1">
                  <SearchBar autoFocus onClose={() => setSearchOpen(false)} />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  aria-label="Close search bar"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-earth transition-colors hover:bg-beige hover:text-forest"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <IconBtn
                label="Search products"
                onClick={() => {
                  setSearchOpen(true);
                  setMenuOpen(false);
                }}
              >
                <SearchIcon className="h-5 w-5" />
              </IconBtn>
            )}

            {/* Profile */}
            <IconBtn label="Profile" href="/profile" isActive={pathname === "/profile"}>
              <UserIcon className="h-5 w-5" />
            </IconBtn>

            {/* Cart — opens drawer */}
            <IconBtn
              label={cartCount > 0 ? `Cart — ${cartCount} items` : "Cart"}
              badge={cartCount}
              onClick={() => setCartOpen(true)}
            >
              <BagIcon className="h-5 w-5" />
            </IconBtn>
          </div>
        </div>

        {/* Mobile category drawer */}
        {menuOpen && (
          <nav
            aria-label="Categories"
            className="border-t border-beige bg-white lg:hidden"
          >
            <div className="px-4 pb-2 pt-3">
              <SearchBar />
            </div>
            <ul className="px-2 pb-3">
              <li>
                <Link
                  href="/products"
                  onClick={() => setMenuOpen(false)}
                  aria-current={activeCategory === "all" ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-forest/85 transition-colors hover:bg-cream",
                    activeCategory === "all" && "bg-cream font-semibold text-forest",
                  )}
                >
                  All Products
                  <span className="text-xs text-earth-lighter">All</span>
                </Link>
              </li>
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category.slug;
                return (
                  <li key={category.slug}>
                    <Link
                      href={categoryLink(category.slug)}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-forest/85 transition-colors hover:bg-cream",
                        isActive && "bg-cream font-semibold text-forest",
                      )}
                    >
                      {category.name}
                      <span className="text-xs text-earth-lighter">{category.shortName}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-beige px-4 py-3">
              <p className="text-xs leading-relaxed text-earth-light">
                Wood-pressed oils, stone-ground atta &amp; traditional flours.
              </p>
            </div>
          </nav>
        )}
      </header>

      {/* Cart drawer — rendered outside header to avoid z-index stacking context issues */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}