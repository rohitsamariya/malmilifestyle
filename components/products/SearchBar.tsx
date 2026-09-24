"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchIcon, XIcon } from "@/components/ui/icons";
import { searchProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";

interface SearchBarProps {
  /** When true the input auto-focuses on mount (mobile drawer). */
  autoFocus?: boolean;
  className?: string;
}

const MAX_DROPDOWN = 5;

/**
 * Single-border pill search bar with live dropdown and URL navigation.
 *
 * Visual rule: the outer <div> is the ONLY visible border.
 * The <input> is completely borderless and outline-free.
 */
export default function SearchBar({ autoFocus = false, className }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live results from the local product data
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return searchProducts({ query: q }).slice(0, MAX_DROPDOWN);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      navigate();
    }
  }

  function navigate() {
    const q = query.trim();
    setOpen(false);
    inputRef.current?.blur();
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
    } else {
      router.push("/products");
    }
  }

  function clear() {
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* ── The single visible border pill ── */}
      <div
        className={`flex h-[42px] items-center gap-2 rounded-full border bg-white px-4 transition-colors ${
          open && (query.trim().length > 0 || results.length > 0)
            ? "border-forest/30 shadow-[0_0_0_3px_rgba(31,59,44,0.08)]"
            : "border-beige hover:border-earth-lighter"
        }`}
      >
        <SearchIcon className="h-[18px] w-[18px] shrink-0 text-earth-light" />

        {/* The input — completely borderless, no outline, no shadow */}
        <label htmlFor="navbar-search" className="sr-only">Search products</label>
        <input
          ref={inputRef}
          id="navbar-search"
          type="text"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="Search products..."
          aria-label="Search products"
          aria-expanded={open}
          aria-haspopup="listbox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 border-none bg-transparent text-[14px] text-forest outline-none ring-0 placeholder:text-earth-light focus:border-none focus:outline-none focus:ring-0"
        />

        {/* Clear button — only when there is text */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-beige text-earth transition-colors hover:bg-earth-lighter hover:text-forest"
          >
            <XIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* ── Live dropdown ── */}
      {open && query.trim().length > 0 && (
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-2xl border border-beige bg-white shadow-[0_12px_40px_-8px_rgba(21,41,30,0.25)]"
        >
          {results.length === 0 ? (
            <div className="px-4 py-5 text-sm text-earth-light">
              No products matching &ldquo;{query.trim()}&rdquo;
            </div>
          ) : (
            <>
              <ul>
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      role="option"
                      aria-selected={false}
                      onClick={() => { setOpen(false); setQuery(""); }}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-cream"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream-deep">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={44}
                          height={44}
                          unoptimized
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-forest">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-earth-light">
                          {product.madeWith}
                          {product.price !== null && (
                            <span className="ml-2 font-semibold text-forest">
                              from {formatPrice(product.price)}
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="border-t border-beige">
                <button
                  type="button"
                  onClick={navigate}
                  className="flex w-full items-center justify-between px-4 py-3 text-[12px] font-semibold text-forest transition-colors hover:bg-cream"
                >
                  <span>View all results for &ldquo;{query.trim()}&rdquo;</span>
                  <span className="text-earth-light">&#8594;</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}