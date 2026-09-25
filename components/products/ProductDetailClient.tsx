"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/products/Breadcrumb";
import { useCart } from "@/lib/cartContext";
import { CheckIcon } from "@/components/ui/icons";
import { cn, discountPercent, formatPrice } from "@/lib/utils";
import type { Category, Product } from "@/data/types";

interface Props {
  product: Product;
  category?: Category | null;
}

export default function ProductDetailClient({ product, category = null }: Props) {
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  // Default variant: from ?variant= URL param, or first variant
  const paramVariantId = searchParams?.get("variant") ?? "";
  const defaultVariant =
    product.variants.find((v) => v.id === paramVariantId) ??
    product.variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariant?.id ?? "",
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];

  const sellingPrice = activeVariant?.price ?? product.price;
  const mrp = activeVariant?.compareAtPrice ?? product.compareAtPrice;
  const stock = activeVariant?.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const discount = discountPercent(mrp, sellingPrice);
  const saving =
    mrp !== null && sellingPrice !== null && mrp > sellingPrice
      ? mrp - sellingPrice
      : null;

  const currentImage = activeVariant?.image || "/images/hero-visual.svg";

  function handleAddToCart() {
    if (!activeVariant || sellingPrice === null || isOutOfStock || quantity > stock) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        productId: product.id,
        variantId: activeVariant.id,
        productSlug: product.slug,
        productName: product.name,
        variantSize: activeVariant.size,
        productImage: currentImage ?? "",
        price: sellingPrice,
        mrp: mrp,
      });
    }
    setJustAdded(true);
    setQuantity(1);
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          ...(category
            ? [{ label: category.name, href: `/products/${category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="overflow-hidden rounded-2xl border border-beige bg-cream-deep">
          <Image
            src={currentImage}
            alt={product.name}
            width={600}
            height={600}
            unoptimized
            className="h-auto w-full"
          />
        </div>

        {/* Info panel */}
        <div className="flex flex-col">
          {category && (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-earth">
              {category.name}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl font-semibold text-forest sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-forest/80">
            {product.description}
          </p>

          {/* Size selector */}
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-forest">
              Select Size
              {activeVariant && (
                <span className="ml-2 font-normal text-earth">
                  — {activeVariant.size}
                </span>
              )}
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Select size"
            >
              {product.variants.map((variant) => {
                const isSelected = variant.id === selectedVariantId;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    aria-pressed={isSelected}
                     onClick={() => {
                       setSelectedVariantId(variant.id);
                       setQuantity(1);
                     }}
                     disabled={(variant.stock ?? 0) <= 0}
                     className={cn(
                      "flex flex-col items-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                      isSelected
                        ? "border-forest bg-forest text-cream shadow-md"
                        : "border-beige text-forest hover:border-forest/50",
                    )}
                  >
                    <span>{variant.size}</span>
                    {variant.price !== null && (
                      <span
                        className={cn(
                          "mt-0.5 text-[11px] font-medium",
                          isSelected ? "text-cream/80" : "text-earth",
                        )}
                      >
                        {formatPrice(variant.price)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price block */}
          {sellingPrice !== null && (
            <div className="mt-6 flex items-center gap-3">
              {discount ? (
                <span className="rounded-full bg-forest px-3 py-1 text-sm font-black text-cream">
                  {discount}% OFF
                </span>
              ) : null}
              {mrp !== null && (
                <span className="text-base text-earth-lighter line-through">
                  {formatPrice(mrp)}
                </span>
              )}
              <span className="text-3xl font-black text-forest">
                {formatPrice(sellingPrice)}
              </span>
            </div>
          )}
          {saving !== null && (
            <p className="mt-1.5 text-sm font-semibold text-[#2d7a4f]">
              You save {formatPrice(saving)} per unit
            </p>
          )}

          {/* Quantity selector */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-forest">Quantity</p>
              <p className={`text-xs font-semibold ${isOutOfStock ? "text-red-600" : "text-earth"}`}>
                {isOutOfStock ? "Out of stock" : `${stock} available`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-beige text-lg font-bold text-forest transition-colors hover:bg-beige disabled:cursor-not-allowed disabled:opacity-40"
              >
                -
              </button>
              <span
                className="w-8 text-center text-base font-bold text-forest"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                disabled={quantity >= stock || isOutOfStock}
                aria-label="Increase quantity"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-beige text-lg font-bold text-forest transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
              {sellingPrice !== null && quantity > 1 && (
                <span className="ml-2 text-sm font-semibold text-forest">
                  = {formatPrice(sellingPrice * quantity)}
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || quantity > stock}
              className={cn(
                "flex h-13 flex-1 items-center justify-center gap-2.5 rounded-xl text-base font-black tracking-wide transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
                justAdded
                  ? "bg-forest/75 text-cream"
                  : "bg-forest text-cream hover:bg-[#1b4d30] hover:shadow-[0_8px_24px_-6px_rgba(21,65,40,0.5)]",
              )}
            >
              {justAdded ? (
                <>
                  <CheckIcon className="h-5 w-5" />
                  Added to Cart!
                </>
              ) : (
                <>
                  <svg
                    aria-hidden
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  Add to Cart
                  {quantity > 1 && <span className="ml-1 opacity-80">&times;{quantity}</span>}
                </>
              )}
            </button>
            <Link
              href="/products"
              className="flex h-13 flex-1 items-center justify-center rounded-xl border border-forest px-6 text-base font-semibold text-forest transition-colors hover:bg-beige"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}