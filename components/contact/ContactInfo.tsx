import { ExternalLinkIcon, PhoneIcon, MapPinIcon } from "@/components/ui/icons";

const ADDRESS = "302, Tanishka Commercial Building, Kandivali (E), Mumbai 400101";
const PHONE_DISPLAY = "9950715467";
const PHONE_TEL = "tel:+919950715467";

/** Google Maps search for the supplied address — no coordinates invented. */
const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`;

/**
 * Visit-Us / Call-Us cards plus a "Get Directions" link built from the real
 * address (a search query, not fabricated coordinates). No invented email,
 * hours or social accounts.
 */
export default function ContactInfo() {
  return (
    <section aria-labelledby="contact-info-heading" className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
            <span className="h-px w-9 bg-gold" aria-hidden />
            Contact Information
          </p>
          <h2
            id="contact-info-heading"
            className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl lg:text-[2.625rem]"
          >
            Find Us
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {/* Visit Us */}
          <div className="flex h-full flex-col rounded-2xl border border-beige bg-white p-7 lg:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-beige bg-cream text-forest">
              <MapPinIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-forest">
              Visit Us
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-earth-light">
              {ADDRESS}
            </p>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13px] font-semibold text-forest underline decoration-forest/30 underline-offset-4 transition-colors hover:decoration-forest"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              Get Directions
            </a>
          </div>

          {/* Call Us */}
          <div className="flex h-full flex-col rounded-2xl border border-beige bg-white p-7 lg:p-8">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-beige bg-cream text-forest">
              <PhoneIcon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-lg font-semibold text-forest">
              Call Us
            </h3>
            <a
              href={PHONE_TEL}
              className="mt-2.5 inline-block font-display text-2xl font-semibold tracking-tight text-forest transition-colors hover:text-forest-soft"
            >
              {PHONE_DISPLAY}
            </a>
            <p className="mt-2 text-sm text-earth-light">
              Tap to call from your mobile phone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}