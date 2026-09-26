"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const fieldClass =
  "mt-1.5 h-11 w-full rounded-lg border border-sand bg-white px-3.5 text-sm text-forest outline-none focus:border-forest";
const labelClass = "block text-xs font-semibold text-earth";

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

interface AuthResponse {
  error?: string;
  fieldErrors?: FieldErrors;
  redirectTo?: string;
}

interface AuthFormProps {
  mode: "login" | "register";
  /** Server-validated, already-sanitised destination. */
  redirectTo: string;
}

export default function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload: Record<string, string> = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: redirectTo,
    };
    if (isRegister) {
      payload.name = String(form.get("name") ?? "");
      payload.phone = String(form.get("phone") ?? "");
    }

    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as AuthResponse;
      if (!response.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        throw new Error(result.error || "Something went wrong. Please try again.");
      }
      // The cart lives in localStorage and is untouched by sign-in, so the
      // customer returns to exactly the page they came from with it intact.
      router.replace(result.redirectTo ?? redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-forest">
        {isRegister ? "Create your account" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-earth">
        {isRegister
          ? "Save your details and keep track of every order."
          : "Sign in to check out and see your orders."}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
        {isRegister && (
          <label className={labelClass}>
            Full name
            <input
              className={fieldClass}
              name="name"
              autoComplete="name"
              maxLength={80}
              required
            />
            {fieldErrors.name && (
              <span role="alert" className="mt-1 block text-xs text-red-700">
                {fieldErrors.name}
              </span>
            )}
          </label>
        )}

        <label className={labelClass}>
          Email
          <input
            className={fieldClass}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            required
          />
          {fieldErrors.email && (
            <span role="alert" className="mt-1 block text-xs text-red-700">
              {fieldErrors.email}
            </span>
          )}
        </label>

        {isRegister && (
          <label className={labelClass}>
            Mobile number
            <input
              className={fieldClass}
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={15}
              placeholder="10-digit mobile number"
              required
            />
            {fieldErrors.phone && (
              <span role="alert" className="mt-1 block text-xs text-red-700">
                {fieldErrors.phone}
              </span>
            )}
          </label>
        )}

        <label className={labelClass}>
          Password
          <input
            className={fieldClass}
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? 8 : undefined}
            maxLength={200}
            required
          />
          {fieldErrors.password && (
            <span role="alert" className="mt-1 block text-xs text-red-700">
              {fieldErrors.password}
            </span>
          )}
        </label>

        {error && (
          <p
            role="alert"
            className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-12 w-full items-center justify-center rounded-lg bg-forest px-6 text-sm font-bold text-cream transition-colors hover:bg-[#1b4d30] disabled:cursor-wait disabled:opacity-60"
        >
          {submitting
            ? isRegister
              ? "Creating account..."
              : "Signing in..."
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-earth">
        {isRegister ? "Already have an account? " : "New to Malmi? "}
        <Link
          href={
            isRegister
              ? `/login?redirect=${encodeURIComponent(redirectTo)}`
              : `/register?redirect=${encodeURIComponent(redirectTo)}`
          }
          className="font-bold text-forest underline underline-offset-4"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </main>
  );
}
