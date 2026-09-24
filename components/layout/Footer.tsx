"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES } from "@/data/categories";
import { productsHref } from "@/lib/utils";
import NewsletterForm from "@/components/layout/NewsletterForm";

const COMPANY_LINKS = [
  { label: "About", href: "/#about" },
  { label: "Why Malmi", href: "/#why-malmi" },
  { label: "Contact", href: "#contact" },
];

const SUPPORT_LINKS = [
  { label: "Contact", href: "#contact" },
  { label: "FAQs", href: "#faqs" },
];

export default function Footer() {
  const pathname = usePathname();

  // Hide customer Footer on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="bg-forest-deep text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:px-8">
        {/* Brand + newsletter */}
        <div>
          <p className="font-display text-2xl font-semibold tracking-[0.28em]">
            MALMI
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.5em] text-gold-soft">
            Lifestyle
          </p>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/75">
            Pure, natural and traditional foods for the everyday Indian kitchen —
            wood-pressed oils and stone-ground flours milled the old way.
          </p>
          <div className="mt-7" id="contact">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
              Subscribe to our newsletter
            </h3>
            <div className="mt-3">
              <NewsletterForm />
            </div>
            <p className="mt-3 text-sm text-cream/75">
              Or email{" "}
              <a
                href="mailto:care@malmilifestyle.in"
                className="underline decoration-gold/60 underline-offset-4 hover:text-gold-soft"
              >
                care@malmilifestyle.in
              </a>
            </p>
          </div>
        </div>

        {/* Shop */}
        <nav aria-label="Shop" className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
            Shop
          </h3>
          <Link
            href="/products"
            className="text-sm text-cream/75 transition-colors hover:text-cream"
          >
            All Products
          </Link>
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={productsHref({ category: category.slug })}
              className="text-sm text-cream/75 transition-colors hover:text-cream"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {/* Company */}
        <nav aria-label="Company" className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
            Company
          </h3>
          {COMPANY_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-cream/75 transition-colors hover:text-cream"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Customer support */}
        <nav aria-label="Customer support" className="flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-soft">
            Customer Support
          </h3>
          {SUPPORT_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-cream/75 transition-colors hover:text-cream"
            >
              {link.label}
            </Link>
          ))}
          <p className="mt-2 text-xs leading-relaxed text-cream/55">
            Pure · Natural · Traditional
          </p>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-cream/50 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Malmi Lifestyle. All rights reserved.</p>
          <p className="tracking-wide">Made with care in India</p>
        </div>
      </div>
    </footer>
  );
}