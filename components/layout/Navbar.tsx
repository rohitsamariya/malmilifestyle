"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
import useCatalogNavigation from "@/components/layout/useCatalogNavigation";
import { cn, productsHref } from "@/lib/utils";

/** Static navigation destinations. The catalog itself stays DB-driven. */
const STATIC_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/** "All Oils" for Wood-Pressed Oils, "All Wheat Atta" for a future category. */
function allLabel(shortName: string, name: string): string {
  return `All ${shortName || name}`;
}

function activeFromPath(pathname: string, categories: Array<{ slug: string }>): string {
  if (pathname === "/products" || pathname === "/products/") return "all";
  if (pathname.startsWith("/products/")) {
    const segment = pathname.split("/")[2] ?? "";
    return categories.some((category) => category.slug === segment) ? segment : "";
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

export default function Navbar({ isCustomerSignedIn = false }: { isCustomerSignedIn?: boolean }) {
  const pathname = usePathname();
  const categories = useCatalogNavigation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [openMenuSlug, setOpenMenuSlug] = useState<string | null>(null);
  const [navbarHydrated, setNavbarHydrated] = useState(false);
  const { cartCount } = useCart();
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setNavbarHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // A route change closes both the mega menu and the dropdown. Adjusting this
  // during render (rather than in an effect) means the menus are already closed
  // in the same commit as the new page, with no extra render pass.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setOpenMenuSlug(null);
    setMenuOpen(false);
  }

  // Clicking anywhere else closes the dropdown.
  useEffect(() => {
    if (!openMenuSlug) return;
    function onPointerDown(event: MouseEvent) {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenuSlug(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenuSlug(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenuSlug]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const activeCategory = activeFromPath(pathname, categories);

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
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:h-18 lg:px-8">

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

          {/* Logo — image only, no text */}
          <Link
            href="/"
            className="flex shrink-0 items-center leading-none"
            aria-label="Malmi Lifestyle home"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/images/malmi-logo.png"
              alt="Malmi Lifestyle"
              width={220}
              height={100}
              unoptimized
              priority
              className="h-10 w-auto lg:h-11"
            />
          </Link>

          {/* Desktop nav — Home, the DB-driven category dropdowns, then static links */}
          <nav
            ref={navRef}
            aria-label="Main"
            className="mx-6 hidden flex-1 items-center justify-center gap-0.5 lg:flex xl:mx-10"
          >
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 text-[14px] font-medium text-forest/70 transition-colors hover:text-forest",
                pathname === "/"
                  ? "border-b-2 border-forest font-semibold text-forest"
                  : "border-b-2 border-transparent",
              )}
            >
              Home
            </Link>

            {categories.map((category) => {
              const isActive = activeCategory === category.slug;
              const isOpen = openMenuSlug === category.slug;
              return (
                <div
                  key={category.slug}
                  className="relative"
                  onMouseEnter={() => setOpenMenuSlug(category.slug)}
                  onMouseLeave={() => setOpenMenuSlug((current) => (current === category.slug ? null : current))}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1 whitespace-nowrap border-b-2 px-3 py-1.5",
                      isActive
                        ? "border-forest text-forest"
                        : "border-transparent text-forest/70",
                    )}
                    onFocus={() => setOpenMenuSlug(category.slug)}
                  >
                    {/* The category is a real link: clicking the name navigates. */}
                    <Link
                      href={categoryLink(category.slug)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "text-[14px] font-medium transition-colors hover:text-forest",
                        isActive ? "font-semibold" : "font-medium",
                      )}
                    >
                      {category.name}
                    </Link>
                    {/* A separate control toggles the dropdown for pointer and keyboard users. */}
                    <button
                      type="button"
                      aria-label={`Browse ${category.name}`}
                      aria-expanded={isOpen}
                      aria-haspopup="true"
                      onClick={() => setOpenMenuSlug((current) => (current === category.slug ? null : category.slug))}
                      className="-mr-1 flex h-5 w-4 items-center justify-center rounded text-forest/60 transition-colors hover:text-forest"
                    >
                      <svg
                        viewBox="0 0 10 6"
                        aria-hidden="true"
                        className={cn("h-1.5 w-2.5 transition-transform duration-150", isOpen && "rotate-180")}
                      >
                        <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {isOpen && (
                    <div
                      className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-2"
                      onMouseEnter={() => setOpenMenuSlug(category.slug)}
                    >
                      <div className="overflow-hidden rounded-xl border border-beige bg-white py-1.5 shadow-lg shadow-forest/10">
                        <Link
                          href={categoryLink(category.slug)}
                          onClick={() => setOpenMenuSlug(null)}
                          className="block px-4 py-2 text-[13px] font-semibold text-forest transition-colors hover:bg-cream"
                        >
                          {allLabel(category.shortName, category.name)}
                        </Link>
                        <div className="my-1 h-px bg-beige" />
                        {/* Base products only — variants are chosen on the detail page. */}
                        {category.products.map((product) => (
                          <Link
                            key={product.slug}
                            href={`/products/${product.slug}`}
                            onClick={() => setOpenMenuSlug(null)}
                            className="block px-4 py-2 text-[13px] text-forest/80 transition-colors hover:bg-cream hover:text-forest"
                          >
                            {product.name}
                          </Link>
                        ))}
                        {category.products.length === 0 && (
                          <p className="px-4 py-2 text-[13px] text-earth-lighter">No products available yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {STATIC_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="whitespace-nowrap border-b-2 border-transparent px-3 py-1.5 text-[14px] font-medium text-forest/70 transition-colors hover:text-forest"
              >
                {link.label}
              </Link>
            ))}
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

            {/* Profile — signed-out visitors are sent straight to the sign-in page */}
            <IconBtn
              label={isCustomerSignedIn ? "Your account" : "Sign in"}
              href={isCustomerSignedIn ? "/profile" : "/login"}
              isActive={pathname === "/profile"}
            >
              <UserIcon className="h-5 w-5" />
            </IconBtn>

            {/* Cart — opens drawer */}
            <IconBtn
              label={navbarHydrated && cartCount > 0 ? `Cart — ${cartCount} items` : "Cart"}
              badge={navbarHydrated ? cartCount : 0}
              onClick={() => setCartOpen(true)}
            >
              <BagIcon className="h-5 w-5" />
            </IconBtn>
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {menuOpen && (
          <nav
            aria-label="Main"
            className="border-t border-beige bg-white lg:hidden"
          >
            <div className="px-4 pb-2 pt-3">
              <SearchBar />
            </div>
            <ul className="px-2 pb-3">
              <li>
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  aria-current={pathname === "/" ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-forest/85 transition-colors hover:bg-cream",
                    pathname === "/" && "bg-cream font-semibold text-forest",
                  )}
                >
                  Home
                </Link>
              </li>
              {categories.map((category) => {
                const isActive = activeCategory === category.slug;
                const isOpen = openMenuSlug === category.slug;
                return (
                  <li key={category.slug} className="border-b border-beige/60 last:border-0">
                    <div className="flex items-stretch">
                      <Link
                        href={categoryLink(category.slug)}
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex flex-1 items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-forest/85 transition-colors hover:bg-cream",
                          isActive && "bg-cream font-semibold text-forest",
                        )}
                      >
                        {category.name}
                        <span className="text-xs text-earth-lighter">{category.shortName}</span>
                      </Link>
                      <button
                        type="button"
                        aria-label={`Browse ${category.name}`}
                        aria-expanded={isOpen}
                        onClick={() => setOpenMenuSlug((current) => (current === category.slug ? null : category.slug))}
                        className="flex w-11 items-center justify-center rounded-lg text-forest/60 transition-colors hover:bg-cream"
                      >
                        <svg
                          viewBox="0 0 10 6"
                          aria-hidden="true"
                          className={cn("h-1.5 w-2.5 transition-transform duration-150", isOpen && "rotate-180")}
                        >
                          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                    {isOpen && (
                      <ul className="mb-2 ml-3 border-l border-beige pl-3">
                        <li>
                          <Link
                            href={categoryLink(category.slug)}
                            onClick={() => setMenuOpen(false)}
                            className="block rounded-lg px-3 py-2 text-[14px] font-semibold text-forest transition-colors hover:bg-cream"
                          >
                            {allLabel(category.shortName, category.name)}
                          </Link>
                        </li>
                        {category.products.map((product) => (
                          <li key={product.slug}>
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="block rounded-lg px-3 py-2 text-[14px] text-forest/80 transition-colors hover:bg-cream hover:text-forest"
                            >
                              {product.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
              {STATIC_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-forest/85 transition-colors hover:bg-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

      {/* Cart drawer — rendered outside header to avoid z-index stacking context issues */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}