"use client";

import { useState } from "react";
import { CloseIcon, UserIcon } from "@/components/ui/icons";

export default function ProfileClient() {
  const [modalOpen, setModalOpen] = useState(false);
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSubmitted(false);
    setPhoneOrEmail("");
  }

  return (
    <div className="flex flex-1 flex-col bg-cream/50">
      {/* ── 1. Dark Forest-Green Account Hero ────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest py-10 text-cream sm:py-14">
        {/* Subtle decorative background pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#e6d5bc_1px,transparent_1px)] [background-size:16px_16px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          {/* User Icon Badge */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cream/15 text-cream ring-4 ring-cream/20 sm:h-16 sm:w-16">
            <UserIcon className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>

          {/* Heading */}
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl lg:text-4xl">
            Your Account
          </h1>

          {/* Subtitle */}
          <p className="mt-2 text-xs text-cream-light/85 sm:text-sm">
            Login to manage your orders, addresses and account details.
          </p>
        </div>
      </section>

      {/* ── 2. Centered Login Card (100px margin top & bottom) ──────────── */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-[100px] sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-beige bg-white p-6 shadow-[0_16px_40px_-16px_rgba(21,41,30,0.18)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            {/* Lock Badge */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-forest">
              <svg
                aria-hidden
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h2 className="mt-4 text-xl font-bold text-forest">
              Login to your account
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-earth sm:text-sm">
              Sign in to access your orders, addresses and account details.
            </p>

            {/* Login Button */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-forest text-sm font-bold tracking-wider text-cream shadow-md transition-all hover:bg-[#1b4d30] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-forest/50"
            >
              LOGIN
            </button>
          </div>
        </div>
      </main>

      {/* ── 3. Interactive Login Modal ───────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-beige bg-white p-6 shadow-2xl sm:p-8">
            {/* Close button */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close modal"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-earth hover:bg-cream"
            >
              <CloseIcon className="h-5 w-5" />
            </button>

            {!submitted ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream text-forest">
                  <UserIcon className="h-6 w-6" />
                </div>

                <h3
                  id="login-modal-title"
                  className="mt-4 text-center text-xl font-bold text-forest"
                >
                  Sign In to Malmi
                </h3>

                <p className="mt-1 text-center text-xs text-earth sm:text-sm">
                  Enter your mobile number or email address to receive a one-time password (OTP).
                </p>

                <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                  <div>
                    <label
                      htmlFor="phone-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-earth"
                    >
                      Mobile / Email
                    </label>
                    <input
                      id="phone-email"
                      type="text"
                      required
                      placeholder="+91 98765 43210 or name@example.com"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/40 px-4 py-3 text-sm text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-forest py-3 text-sm font-bold tracking-wider text-cream shadow-md transition-all hover:bg-[#1b4d30]"
                  >
                    GET OTP
                  </button>

                  <p className="text-center text-[11px] text-earth-lighter">
                    Authentication backend is coming soon.
                  </p>
                </form>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest">
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h4 className="mt-3 text-lg font-bold text-forest">
                  Login Coming Soon!
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-earth">
                  Thank you for testing the Malmi Lifestyle UI. Account authentication and order management features will be enabled in an upcoming release.
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-6 w-full rounded-xl bg-forest py-2.5 text-xs font-bold uppercase tracking-wider text-cream"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
