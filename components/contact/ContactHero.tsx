import Image from "next/image";

/**
 * Contact hero: compact editorial two-column layout mirroring the Home and
 * About heroes — copy on the left, a single landscape visual in a rounded
 * image frame on the right.
 */
const CONTACT_HERO_SRC = "/images/contact-hero.png";

export default function ContactHero() {
  return (
    <section
      aria-labelledby="contact-hero-heading"
      className="relative overflow-hidden border-b border-beige bg-[linear-gradient(135deg,#faf6ed_0%,#f5eddd_45%,#efe3ca_100%)]"
    >
      {/* Restrained texture — brand motif only, no imagery */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='96' height='96' viewBox='0 0 96 96' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231f3b2c'%3E%3Cpath d='M22 40c10 0 18 8 18 18s-8 18-18 18S4 68 4 58s8-18 18-18z'/%3E%3Cpath d='M72 16c8 0 14 6 14 14s-6 14-14 14-14-6-14-14 6-14 14-14z'/%3E%3Ccircle cx='68' cy='70' r='8'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "96px 96px",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:gap-14 lg:px-8 lg:py-14">
        {/* Copy */}
        <div className="max-w-xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-earth">
            <span className="h-px w-10 bg-gold" aria-hidden />
            Get in Touch
          </p>

          <h1
            id="contact-hero-heading"
            className="mt-5 font-display text-[2.5rem] font-semibold leading-[1.06] tracking-tight text-forest sm:text-5xl lg:text-[3.25rem]"
          >
            We&apos;d Love to
            <br />
            <span className="text-earth">Hear From You</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-forest/80 sm:text-lg">
            Questions about our products, packaging, or your order? Reach the
            Malmi Lifestyle team — we&apos;re happy to help.
          </p>
        </div>

        {/* Single dominant visual */}
        <div className="relative">
          <div className="relative h-[240px] overflow-hidden rounded-[20px] border border-sand/70 bg-cream-deep/50 shadow-[0_36px_80px_-40px_rgba(21,41,30,0.6)] sm:h-[280px] lg:h-[300px]">
            <Image
              src={CONTACT_HERO_SRC}
              alt="Malmi Lifestyle — we're here to help"
              width={1800}
              height={984}
              unoptimized
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="absolute -top-3 -left-3 rounded-full border border-beige bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest shadow-[0_8px_20px_-8px_rgba(31,59,44,0.35)] sm:-top-4 sm:-left-5">
            We&apos;re Here to Help
          </span>
          <span className="absolute -bottom-3 -right-3 rounded-full border border-beige bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-forest shadow-[0_8px_20px_-8px_rgba(31,59,44,0.35)] sm:-bottom-4 sm:-right-5">
            Get in Touch
          </span>
        </div>
      </div>
    </section>
  );
}