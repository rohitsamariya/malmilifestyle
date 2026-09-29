import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

export default function AboutCta({ shopHref }: { shopHref: string }) {
  return (
    <section aria-labelledby="about-cta-heading" className="bg-forest-deep">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <h2
            id="about-cta-heading"
            className="font-display text-[2rem] font-semibold leading-tight tracking-tight text-cream sm:text-4xl lg:text-[3rem]"
          >
            Bring Better Ingredients
            <br /> Into Your Everyday Kitchen.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-cream/70 sm:text-lg">
            Explore the Malmi Lifestyle collection.
          </p>
          <Link
            href={shopHref}
            className="mt-9 inline-flex h-[52px] items-center gap-2 rounded-full bg-cream px-8 text-[15px] font-semibold text-forest transition-colors hover:bg-cream-deep"
          >
            Explore Products
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}