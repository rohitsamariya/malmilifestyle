"use client";

import { useState, type FormEvent } from "react";
import { MapPinIcon } from "@/components/ui/icons";
import AddressForm, {
  EMPTY_ADDRESS_FORM,
  addressFormFromDTO,
  type AddressFormValue,
} from "@/components/address/AddressForm";
import { formatAddressSummary } from "@/lib/address-display";
import type { CustomerAddressDTO } from "@/lib/address-service";

interface AddressBookProps {
  initialAddresses: CustomerAddressDTO[];
}

interface AddressListResponse {
  addresses?: CustomerAddressDTO[];
  error?: string;
  fieldErrors?: Record<string, string>;
}

export default function AddressBook({ initialAddresses }: AddressBookProps) {
  const [addresses, setAddresses] = useState<CustomerAddressDTO[]>(initialAddresses);
  const [mode, setMode] = useState<"idle" | "add" | "edit">("idle");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormValue>(EMPTY_ADDRESS_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function resetForm() {
    setMode("idle");
    setEditingId(null);
    setForm(EMPTY_ADDRESS_FORM);
    setFieldErrors({});
    setError("");
  }

  function startAdd() {
    setMode("add");
    setEditingId(null);
    setForm(EMPTY_ADDRESS_FORM);
    setFieldErrors({});
    setError("");
  }

  function startEdit(address: CustomerAddressDTO) {
    setMode("edit");
    setEditingId(address.id);
    setForm(addressFormFromDTO(address));
    setFieldErrors({});
    setError("");
  }

  async function send(url: string, method: string, body?: unknown): Promise<boolean> {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(url, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as AddressListResponse;
      if (!response.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error || "Something went wrong. Please try again.");
        return false;
      }
      if (result.addresses) setAddresses(result.addresses);
      setFieldErrors({});
      return true;
    } catch {
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const payload = { ...form, isDefault: mode === "add" && addresses.length === 0 };
    const url = mode === "edit" && editingId ? `/api/addresses/${editingId}` : "/api/addresses";
    const ok = await send(url, mode === "edit" ? "PATCH" : "POST", payload);
    if (ok) resetForm();
  }

  async function remove(address: CustomerAddressDTO) {
    if (busy) return;
    if (!window.confirm(`Remove the "${address.label}" address for ${address.fullName}?`)) return;
    const ok = await send(`/api/addresses/${address.id}`, "DELETE");
    if (ok && editingId === address.id) resetForm();
  }

  async function makeDefault(address: CustomerAddressDTO) {
    if (busy || address.isDefault) return;
    await send(`/api/addresses/${address.id}/default`, "POST");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-earth">
          {addresses.length === 0
            ? "No saved addresses yet."
            : `You have ${addresses.length} saved ${addresses.length === 1 ? "address" : "addresses"}.`}
        </p>
        {mode !== "add" && (
          <button
            type="button"
            onClick={startAdd}
            disabled={busy || addresses.length >= 10}
            className="inline-flex h-10 items-center rounded-lg bg-forest px-4 text-sm font-bold text-cream disabled:opacity-60"
          >
            Add address
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {mode !== "idle" && (
        <form onSubmit={save} className="mt-5 rounded-2xl border border-beige bg-cream/40 p-5">
          <h3 className="text-sm font-bold text-forest">
            {mode === "edit" ? "Edit address" : "New address"}
          </h3>
          <div className="mt-4">
            <AddressForm
              value={form}
              onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
              fieldErrors={fieldErrors}
              idPrefix={mode === "edit" ? `edit-${editingId}` : "add"}
              disabled={busy}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-11 items-center rounded-lg bg-forest px-5 text-sm font-bold text-cream disabled:opacity-60"
            >
              {busy ? "Saving..." : "Save address"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={busy}
              className="inline-flex h-11 items-center rounded-lg border border-sand px-5 text-sm font-bold text-forest disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length > 0 && (
        <ul className="mt-5 space-y-3">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-2xl border border-beige bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-forest">
                  <MapPinIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-bold text-forest">
                      {address.label}
                    </span>
                    {address.isDefault && (
                      <span className="rounded-full bg-forest px-2.5 py-0.5 text-xs font-bold text-cream">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-forest">{address.fullName}</p>
                  <p className="text-xs text-earth">{address.phone}</p>
                  <p className="mt-1 text-sm text-earth">{formatAddressSummary(address)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold">
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => makeDefault(address)}
                    disabled={busy}
                    className="text-forest underline underline-offset-4 disabled:opacity-60"
                  >
                    Set as default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  disabled={busy}
                  className="text-forest underline underline-offset-4 disabled:opacity-60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(address)}
                  disabled={busy}
                  className="text-red-700 underline underline-offset-4 disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
