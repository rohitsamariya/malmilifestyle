import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

/**
 * Dark-green closing call to action, pointed at the active category listing so
 * it never links to a deactivated or empty section.
 */
export default function FinalCta({ shopHref }: { shopHref: string }) {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-forest-deep"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <h2
            id="final-cta-heading"
            className="font-display text-[2rem] font-semibold leading-tight tracking-tight text-cream sm:text-4xl lg:text-[3rem]"
          >
            Bring Better Ingredients
            <br /> to Your Kitchen
          </h2>
          <p className="mt-5 text-base leading-relaxed text-cream/70 sm:text-lg">
            Explore the Malmi Wood-Pressed Oil collection.
          </p>
          <Link
            href={shopHref}
            className="mt-9 inline-flex h-[54px] items-center gap-2 rounded-full bg-cream px-8 text-[15px] font-semibold text-forest transition-colors hover:bg-cream-deep"
          >
            Shop All Products
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
