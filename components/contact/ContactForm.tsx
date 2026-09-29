"use client";

import { useState } from "react";

const FIELD_HELPERS = {
  badge:
    "mt-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-forest",
  note: "text-sm leading-relaxed text-earth-light",
};

/**
 * Contact form — validated and styled, but intentionally not wired to a
 * backend. There is no contact/mail API in this project yet, so submitting
 * shows an honest "coming soon" notice rather than faking a sent message.
 * The fields are structured so a future route handler can consume them as-is.
 */
export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !mobile.trim() || !message.trim()) return;
    // No backend yet — surface an honest status instead of a fake confirmation.
    setSubmitted(true);
  }

  const fieldClass =
    "mt-1.5 w-full rounded-lg border border-sand bg-white px-3.5 py-3 text-sm text-forest outline-none transition-colors placeholder:text-earth-lighter focus:border-forest";
  const labelClass = "block text-xs font-semibold text-earth";

  return (
    <section
      aria-labelledby="contact-form-heading"
      className="border-t border-beige bg-cream-deep/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-earth">
              <span className="h-px w-9 bg-gold" aria-hidden />
              Send a Message
            </p>
            <h2
              id="contact-form-heading"
              className="mt-4 font-display text-[2rem] font-semibold tracking-tight text-forest sm:text-4xl"
            >
              We&apos;d Love to Help
            </h2>
            <p className="mt-3 text-base leading-relaxed text-earth-light">
              Tell us how we can help — we&apos;ll get back to you as soon as we
              can.
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <label className={labelClass}>
                Full Name
                <input
                  id="contact-name"
                  className={fieldClass}
                  type="text"
                  autoComplete="name"
                  maxLength={200}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className={labelClass}>
                Email
                <input
                  id="contact-email"
                  className={fieldClass}
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className={labelClass}>
                Mobile Number
                <input
                  id="contact-mobile"
                  className={fieldClass}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={15}
                  pattern="[0-9+\s-]{10,15}"
                  title="Enter your 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </label>

              <label className={labelClass}>
                Message
                <textarea
                  id="contact-message"
                  className={`${fieldClass} min-h-36 resize-y`}
                  rows={5}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </label>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-forest px-8 text-[15px] font-semibold text-cream transition-colors hover:bg-forest-soft"
              >
                Send Message
              </button>
            </form>

            {submitted && (
              <div className={FIELD_HELPERS.badge} role="status">
                Thanks, {name.trim().split(" ")[0]}! This form is readied for
                our messaging service — it&apos;s not connected to email yet.
                Please call us on 9950715467 for an immediate reply.
              </div>
            )}
          </div>

          <aside aria-label="Contact details summary" className="self-start lg:sticky lg:top-28">
            <div className="rounded-2xl border border-beige bg-white p-7">
              <h3 className="font-display text-lg font-semibold text-forest">
                Alternatively, reach us by phone
              </h3>
              <a
                href="tel:+919950715467"
                className="mt-3 inline-block font-display text-2xl font-semibold tracking-tight text-forest transition-colors hover:text-forest-soft"
              >
                9950715467
              </a>
              <p className="mt-2 text-sm leading-relaxed text-earth-light">
                The same number used by our Visit-Us card, clickable straight
                from your phone.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}