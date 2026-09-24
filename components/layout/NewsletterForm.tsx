"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
  }

  if (subscribed) {
    return (
      <p className="text-sm text-gold-soft" role="status">
        Thank you for subscribing! We&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-cream outline-none transition-colors placeholder:text-cream/50 focus:border-gold"
      />
      <button
        type="submit"
        className="h-11 shrink-0 rounded-full bg-gold px-5 text-sm font-semibold text-forest-deep transition-colors hover:bg-gold-soft"
      >
        Subscribe
      </button>
    </form>
  );
}