"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductListing } from "@/data/types";
import { getCategory } from "@/data/categories";
import { CheckIcon } from "@/components/ui/icons";
import { useCart } from "@/lib/cartContext";
import { cn, discountPercent, formatPrice } from "@/lib/utils";

interface ProductCardProps {
  listing: ProductListing;
  className?: string;
}

/**
 * Listing-mode product card.
 * Shows ONE specific variant — no size selector pills.
 * Size is informational text only.
 * Clicking the card / name opens the PDP pre-selecting this variant.
 */
export default function ProductCard({ listing, className }: ProductCardProps) {
  const { product, variant } = listing;
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const category = getCategory(product.category);

  const sellingPrice = variant.price ?? product.price;
  const mrp = variant.compareAtPrice ?? product.compareAtPrice;
  const discount = discountPercent(mrp, sellingPrice);
  const saving =
    mrp !== null && sellingPrice !== null && mrp > sellingPrice
      ? mrp - sellingPrice
      : null;

  // PDP link pre-selects this variant via ?variant=<variantId>
  const pdpHref = `/products/${product.slug}?variant=${encodeURIComponent(variant.id)}`;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (sellingPrice === null) return;
    addToCart({
      productId: product.id,
      variantId: variant.id,
      productSlug: product.slug,
      productName: product.name,
      variantSize: variant.size,
      productImage: product.images[0] ?? "",
      price: sellingPrice,
      mrp: mrp,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-beige bg-white shadow-[0_8px_24px_-18px_rgba(21,41,30,0.35)] transition-all duration-200 hover:-translate-y-1 hover:border-earth-lighter hover:shadow-[0_20px_40px_-18px_rgba(31,59,44,0.4)]",
        className,
      )}
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
        <Link href={pdpHref} className="block h-full w-full" aria-label={`${product.name} — ${variant.size}`}>
          <Image
            src={product.images[0]}
            alt={`${product.name} ${variant.size}`}
            width={600}
            height={600}
            unoptimized
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        {/* Discount badge — top-left corner */}
        {discount ? (
          <span className="absolute left-0 top-0 flex flex-col items-center justify-center rounded-br-xl bg-forest px-3 py-2 text-center leading-none text-cream">
            <span className="text-[15px] font-black">{discount}%</span>
            <span className="text-[9px] font-bold uppercase tracking-widest">OFF</span>
          </span>
        ) : null}

        {/* Made-with tag — bottom-left */}
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-cream/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-forest backdrop-blur-sm">
          {product.madeWith}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category label */}
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-earth">
          {category.name}
        </p>

        {/* Product name */}
        <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-forest">
          <Link href={pdpHref} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        {/* Size — informational text, no selector */}
        <p className="mt-1 text-[11px] font-medium text-earth">
          {variant.size}
        </p>

        {/* Price row */}
        {sellingPrice !== null && (
          <div className="mt-2 flex items-baseline gap-2">
            {mrp !== null && (
              <span className="text-[11px] text-earth-lighter line-through">
                {formatPrice(mrp)}
              </span>
            )}
            <span className="text-[20px] font-black leading-none text-forest">
              {formatPrice(sellingPrice)}
            </span>
          </div>
        )}

        {saving !== null && (
          <p className="mt-0.5 text-[10px] font-semibold text-[#2d7a4f]">
            Save {formatPrice(saving)}
          </p>
        )}

        {/* Add to cart */}
        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={handleAdd}
            aria-label={
              justAdded
                ? `${product.name} ${variant.size} added to cart`
                : `Add ${product.name} ${variant.size} to cart`
            }
            className={cn(
              "flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-black tracking-wider transition-all duration-200",
              justAdded
                ? "bg-forest/80 text-cream"
                : "bg-forest text-cream hover:bg-[#1b4d30] hover:shadow-[0_6px_18px_-4px_rgba(21,65,40,0.55)]",
            )}
          >
            {justAdded ? (
              <>
                <CheckIcon className="h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <svg
                  aria-hidden
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                ADD
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}