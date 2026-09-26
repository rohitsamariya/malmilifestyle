"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Invalid email or password.");
      return;
    }

    // Basic email format check
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("Invalid email or password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setErrorMessage(data?.error || "Invalid email or password.");
        return;
      }

      // The server has verified the credentials and the response carried the
      // HttpOnly `malmi_admin_session` cookie, so the browser already holds the
      // session. Only now is it safe to move on: navigating earlier could fetch
      // /admin before the cookie landed and be bounced straight back here.
      //
      // `replace` (not `push`) so Back does not return to a login form that is
      // now backed by a live session. `replace` also issues a fresh server
      // request for /admin, so the router cache cannot hand back the anonymous
      // payload captured when the proxy first redirected us here.
      //
      // Deliberately no `router.refresh()`: called in the same tick it races
      // the transition above, re-renders the login route and wins, leaving the
      // admin on /admin/login with a valid session until they refresh manually.
      router.replace("/admin");
    } catch {
      setErrorMessage("An error occurred during sign in. Please try again.");
    } finally {
      // Always release the button, so a stuck spinner can never require a
      // manual browser refresh to clear.
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* LEFT: Branding Panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-forest p-8 text-cream lg:w-1/2 lg:p-16">
        {/* Subtle background overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#e6d5bc_1px,transparent_1px)] [background-size:20px_20px]"
        />

        <div className="relative z-10">
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl font-bold tracking-[0.3em] text-cream lg:text-3xl">
              MALMI
            </span>
            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.5em] text-gold">
              Lifestyle
            </span>
          </div>
        </div>

        <div className="relative z-10 my-12 max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">
            Admin Portal
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-cream sm:text-4xl lg:text-5xl">
            Store Management & Catalog Control
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-cream/80 sm:text-base">
            Securely access products, categories, orders and store configurations for Malmi Lifestyle.
          </p>
        </div>

        <div className="relative z-10 text-xs text-cream/60">
          &copy; {new Date().getFullYear()} Malmi Lifestyle. All rights reserved.
        </div>
      </div>

      {/* RIGHT: Login Form Card */}
      <div className="flex flex-1 items-center justify-center bg-cream/50 p-6 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="w-full max-w-md rounded-2xl border border-beige bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cream text-forest">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold text-forest">
              Admin Sign In
            </h2>
            <p className="mt-1 text-xs text-earth sm:text-sm">
              Enter your credentials to access the admin portal.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-800 border border-red-200">
              <svg className="h-4 w-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-bold uppercase tracking-wider text-earth"
              >
                Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@malmilifestyle.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-3 text-sm text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold uppercase tracking-wider text-earth"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-sand bg-cream-deep/30 px-4 py-3 text-sm text-forest placeholder:text-earth-lighter focus:border-forest focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest/20"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-earth cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-sand text-forest focus:ring-forest/20"
                />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-forest text-sm font-bold tracking-wider text-cream shadow-md transition-all hover:bg-[#1b4d30] disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-cream" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
