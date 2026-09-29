import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";

interface AboutHeroProps {
  /** Link for the primary CTA, pointed at the active category listing. */
  shopHref: string;
}

/**
 * About hero: compact editorial brand statement with a single earned visual.
 * Mirrors the homepage hero's colour field and type lockup, with one clear
 * primary action pointing at the live catalog.
 */
export default function AboutHero({ shopHref }: AboutHeroProps) {
  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative overflow-hidden border-b border-beige bg-[linear-gradient(135deg,#faf6ed_0%,#f5eddd_45%,#efe3ca_100%)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='96' height='96' viewBox='0 0 96 96' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231f3b2c'%3E%3Cpath d='M22 40c10 0 18 8 18 18s-8 18-18 18S4 68 4 58s8-18 18-18z'/%3E%3Cpath d='M72 16c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14z'/%3E%3Ccircle cx='68' cy='70' r='8'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "96px 96px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:gap-14 lg:px-8 lg:py-14">
        <div className="max-w-xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-earth">
            <span className="h-px w-10 bg-gold" aria-hidden />
            About Malmi
          </p>

          <h1
            id="about-hero-heading"
            className="mt-5 font-display text-[2.5rem] font-semibold leading-[1.06] tracking-tight text-forest sm:text-5xl lg:text-[3.25rem]"
          >
            Rooted in Tradition.
            <br />
            <span className="text-earth">Made for Everyday Life.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-forest/80 sm:text-lg">
            Malmi Lifestyle brings together thoughtfully selected foods and
            traditional processing for the everyday Indian kitchen.
          </p>

          <Link
            href={shopHref}
            className="mt-7 inline-flex h-[52px] items-center gap-2 rounded-full bg-forest px-8 text-[15px] font-semibold text-cream transition-colors hover:bg-forest-soft"
          >
            Explore Our Products
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative">
          <div className="relative h-[240px] overflow-hidden rounded-[20px] border border-sand/70 bg-cream-deep/50 shadow-[0_36px_80px_-40px_rgba(21,41,30,0.6)] sm:h-[280px] lg:h-[300px]">
            <Image
              src="/images/about-hero-traditional-process.png"
              alt="Traditional wood-pressing process"
              width={1800}
              height={984}
              unoptimized
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="absolute -top-3 -left-3 rounded-full border border-beige bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest shadow-[0_8px_20px_-8px_rgba(31,59,44,0.35)] sm:-top-4 sm:-left-5">
            Thoughtfully Selected
          </span>
          <span className="absolute -bottom-3 -right-3 rounded-full border border-beige bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest shadow-[0_8px_20px_-8px_rgba(31,59,44,0.35)] sm:-bottom-4 sm:-right-5">
            Traditionally Made
          </span>
        </div>
      </div>
    </section>
  );
}