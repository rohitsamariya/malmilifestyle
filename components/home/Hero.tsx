import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { productsHref } from "@/lib/utils";

const STATS: Array<[string, string]> = [
  ["7", "wood-pressed oils"],
  ["12", "stone-ground flours"],
  ["19", "products"],
];

/**
 * Large premium split hero: strong editorial copy on the left, large Malmi
 * visual placeholder on the right (swap `/images/hero-visual.svg` for final
 * product photography when available).
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-beige bg-[linear-gradient(135deg,#f3ecdd_0%,#efe4cc_45%,#eadfc4_70%,#e3d5b8_100%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='90' height='90' viewBox='0 0 90 90' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231f3b2c'%3E%3Cpath d='M18 34c9 0 16 7 16 16s-7 16-16 16S2 59 2 50 9 34 18 34z'/%3E%3Cpath d='M64 14c7 0 13 6 13 13s-6 13-13 13-13-6-13-13 6-13 13-13z'/%3E%3Ccircle cx='60' cy='62' r='7'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "90px 90px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:min-h-[600px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8 lg:py-24">
        {/* Copy */}
        <div>
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            Pure. Natural. Traditional.
          </p>

          <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-forest sm:text-6xl lg:text-[3.9rem]">
            Better Food Begins With <span className="text-earth">Better Ingredients</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-forest/80 sm:text-lg">
            Carefully selected everyday staples, made for people who value
            quality, simplicity and traditional food. From wood-pressed oils to
            stone-ground flours — made the honest way.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <Link
              href={productsHref()}
              className="inline-flex h-[52px] items-center gap-2 rounded-full bg-forest px-8 text-[15px] font-semibold text-cream transition-colors hover:bg-forest-soft"
            >
              Shop All Products
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href={productsHref({ category: "wood-pressed-oils" })}
              className="inline-flex h-[52px] items-center rounded-full border border-forest/25 bg-white/60 px-8 text-[15px] font-semibold text-forest transition-colors hover:border-forest hover:bg-white"
            >
              Explore Wood-Pressed Oils
            </Link>
          </div>

          <ul className="mt-11 flex max-w-md flex-wrap gap-x-10 gap-y-5" aria-label="Highlights">
            {STATS.map(([stat, label]) => (
              <li key={label} className="flex items-baseline gap-2.5">
                <span className="font-display text-4xl font-semibold text-forest lg:text-[2.75rem]">
                  {stat}
                </span>
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-earth">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Visual */}
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-sand/70 bg-cream/60 shadow-[0_30px_70px_-32px_rgba(21,41,30,0.55)]">
            <Image
              src="/images/hero-visual.svg"
              alt="Wood-pressed oil and stone-ground flour essence of Malmi Lifestyle"
              width={1000}
              height={1000}
              unoptimized
              priority
              className="h-auto w-full"
            />
          </div>
          <div className="absolute -top-3 left-3 rounded-full border border-beige bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-forest shadow-[0_8px_20px_-8px_rgba(31,59,44,0.35)] sm:-left-5 sm:-top-4">
            Wood-Pressed
          </div>
          <div className="absolute -bottom-3 right-3 rounded-full border border-beige bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-forest shadow-[0_8px_20px_-8px_rgba(31,59,44,0.35)] sm:-bottom-4 sm:-right-5">
            Stone-Ground
          </div>
        </div>
      </div>
    </section>
  );
}