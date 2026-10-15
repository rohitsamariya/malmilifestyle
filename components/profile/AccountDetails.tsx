"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerDTO } from "@/lib/customerAuth";
import { CheckIcon } from "@/components/ui/icons";
import PhoneStatusBadge from "./PhoneStatusBadge";

const fieldClass =
  "mt-1.5 h-11 w-full rounded-lg border border-sand bg-white px-3.5 text-sm text-forest outline-none focus:border-forest disabled:bg-cream disabled:opacity-70";
const labelClass = "block text-xs font-semibold text-earth";

function formatMemberSince(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-earth-light">{label}</dt>
      <dd className="mt-0.5 font-semibold text-forest">{children}</dd>
    </div>
  );
}

/**
 * The customer's editable account details. Name and mobile can be changed;
 * email is the login identity and stays read-only. The account is resolved from
 * the session on the server, so this form can only ever edit the signed-in user.
 */
export default function AccountDetails({ customer }: { customer: CustomerDTO }) {
  const router = useRouter();
  const [current, setCurrent] = useState(customer);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  function startEdit() {
    setName(current.name);
    setPhone(current.phone);
    setFieldErrors({});
    setFormError("");
    setJustSaved(false);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setFieldErrors({});
    setFormError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormError("");
    setJustSaved(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        customer?: CustomerDTO;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !payload.customer) {
        setFieldErrors(payload.fieldErrors ?? {});
        setFormError(payload.error ?? "Unable to update your profile right now. Please retry.");
        return;
      }

      setCurrent(payload.customer);
      setEditing(false);
      setJustSaved(true);
      router.refresh();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="account-heading"
      className="h-fit rounded-2xl border border-beige bg-white p-6 shadow-[0_16px_40px_-16px_rgba(21,41,30,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="account-heading" className="font-display text-lg font-semibold text-forest">
          Account details
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="rounded-lg border border-sand px-3 py-1.5 text-xs font-bold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-cream"
          >
            Edit profile
          </button>
        )}
      </div>

      {justSaved && !editing && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-lg border border-forest/20 bg-forest/5 px-3 py-2 text-xs font-medium text-forest"
        >
          <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your account details have been updated.</span>
        </div>
      )}

      {formError && !editing && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {formError}
        </p>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <label className={labelClass} htmlFor="profile-name">
            Full name
            <input
              id="profile-name"
              className={fieldClass}
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={saving}
              required
            />
            {fieldErrors.name && (
              <span className="mt-1 block text-xs font-medium text-red-700">{fieldErrors.name}</span>
            )}
          </label>

          <label className={labelClass} htmlFor="profile-phone">
            Mobile number
            <input
              id="profile-phone"
              className={fieldClass}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={16}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={saving}
              required
            />
            {fieldErrors.phone && (
              <span className="mt-1 block text-xs font-medium text-red-700">{fieldErrors.phone}</span>
            )}
          </label>

          <label className={labelClass} htmlFor="profile-email">
            Email
            <input
              id="profile-email"
              className={fieldClass}
              value={current.email}
              disabled
              readOnly
            />
            <span className="mt-1 block text-xs font-normal text-earth-light">
              Email is your sign-in address and can&apos;t be changed here.
            </span>
          </label>

          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center rounded-lg bg-forest px-5 text-sm font-bold text-cream transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-lg border border-sand px-5 text-sm font-bold text-forest transition-colors hover:bg-cream disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-5 space-y-4 text-sm">
          <Detail label="Name">{current.name || "Not provided"}</Detail>
          <Detail label="Email">
            <span className="break-all">{current.email}</span>
          </Detail>
          <Detail label="Mobile number">
            <span className="flex flex-wrap items-center gap-2">
              {current.phone || "Not provided"}
              {current.phone && <PhoneStatusBadge verified={current.phoneVerified} />}
            </span>
            {current.phone && (
              <span className="mt-1 block text-xs font-normal text-earth-light">
                {current.phoneVerified
                  ? "This number is verified for delivery updates."
                  : "We'll use this number for order and delivery updates."}
              </span>
            )}
          </Detail>
          <Detail label="Member since">{formatMemberSince(current.createdAt)}</Detail>
        </dl>
      )}
    </section>
  );
}
