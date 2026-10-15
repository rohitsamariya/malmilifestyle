"use client";

import { ADDRESS_LABELS, type AddressLabel } from "@/lib/address-constants";
import type { CustomerAddressDTO } from "@/lib/address-service";

export interface AddressFormValue {
  label: AddressLabel;
  fullName: string;
  phone: string;
  house: string;
  building: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export const EMPTY_ADDRESS_FORM: AddressFormValue = {
  label: "Home",
  fullName: "",
  phone: "",
  house: "",
  building: "",
  locality: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

export function addressFormFromDTO(address: CustomerAddressDTO): AddressFormValue {
  return {
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    house: address.house,
    building: address.building,
    locality: address.locality,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country || "India",
  };
}

interface AddressFormProps {
  value: AddressFormValue;
  onChange: (field: keyof AddressFormValue, value: string) => void;
  fieldErrors?: Record<string, string>;
  idPrefix: string;
  disabled?: boolean;
}

const fieldClass =
  "mt-1.5 h-11 w-full rounded-lg border border-sand bg-white px-3.5 text-sm text-forest outline-none focus:border-forest disabled:opacity-60";
const labelClass = "block text-xs font-semibold text-earth";

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1 block text-xs font-medium text-red-700">{message}</span>;
}

/** Controlled address fields shared by the profile address book and checkout. */
export default function AddressForm({
  value,
  onChange,
  fieldErrors = {},
  idPrefix,
  disabled = false,
}: AddressFormProps) {
  const id = (name: string) => `${idPrefix}-${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={labelClass} htmlFor={id("label")}>
        Label
        <select
          id={id("label")}
          className={fieldClass}
          value={value.label}
          onChange={(event) => onChange("label", event.target.value)}
          disabled={disabled}
        >
          {ADDRESS_LABELS.map((label) => (
            <option key={label} value={label}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass} htmlFor={id("fullName")}>
        Full name
        <input
          id={id("fullName")}
          className={fieldClass}
          autoComplete="name"
          maxLength={100}
          value={value.fullName}
          onChange={(event) => onChange("fullName", event.target.value)}
          disabled={disabled}
          required
        />
        <ErrorText message={fieldErrors.fullName} />
      </label>
      <label className={labelClass} htmlFor={id("phone")}>
        Mobile number
        <input
          id={id("phone")}
          className={fieldClass}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={16}
          placeholder="10-digit mobile number"
          value={value.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          disabled={disabled}
          required
        />
        <ErrorText message={fieldErrors.phone} />
      </label>
      <label className={labelClass} htmlFor={id("house")}>
        House / flat / building number
        <input
          id={id("house")}
          className={fieldClass}
          autoComplete="address-line1"
          maxLength={200}
          value={value.house}
          onChange={(event) => onChange("house", event.target.value)}
          disabled={disabled}
          required
        />
        <ErrorText message={fieldErrors.house} />
      </label>
      <label className={labelClass} htmlFor={id("building")}>
        Building / apartment <span className="font-normal text-earth-light">(optional)</span>
        <input
          id={id("building")}
          className={fieldClass}
          autoComplete="address-line2"
          maxLength={200}
          value={value.building}
          onChange={(event) => onChange("building", event.target.value)}
          disabled={disabled}
        />
        <ErrorText message={fieldErrors.building} />
      </label>
      <label className={labelClass} htmlFor={id("locality")}>
        Area / locality <span className="font-normal text-earth-light">(optional)</span>
        <input
          id={id("locality")}
          className={fieldClass}
          autoComplete="address-line3"
          maxLength={120}
          value={value.locality}
          onChange={(event) => onChange("locality", event.target.value)}
          disabled={disabled}
        />
        <ErrorText message={fieldErrors.locality} />
      </label>
      <label className={labelClass} htmlFor={id("landmark")}>
        Landmark <span className="font-normal text-earth-light">(optional)</span>
        <input
          id={id("landmark")}
          className={fieldClass}
          maxLength={120}
          value={value.landmark}
          onChange={(event) => onChange("landmark", event.target.value)}
          disabled={disabled}
        />
        <ErrorText message={fieldErrors.landmark} />
      </label>
      <label className={labelClass} htmlFor={id("city")}>
        City
        <input
          id={id("city")}
          className={fieldClass}
          autoComplete="address-level2"
          maxLength={80}
          value={value.city}
          onChange={(event) => onChange("city", event.target.value)}
          disabled={disabled}
          required
        />
        <ErrorText message={fieldErrors.city} />
      </label>
      <label className={labelClass} htmlFor={id("state")}>
        State
        <input
          id={id("state")}
          className={fieldClass}
          autoComplete="address-level1"
          maxLength={80}
          value={value.state}
          onChange={(event) => onChange("state", event.target.value)}
          disabled={disabled}
          required
        />
        <ErrorText message={fieldErrors.state} />
      </label>
      <label className={labelClass} htmlFor={id("pincode")}>
        Pincode
        <input
          id={id("pincode")}
          className={fieldClass}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          pattern="[0-9]{6}"
          value={value.pincode}
          onChange={(event) => onChange("pincode", event.target.value)}
          disabled={disabled}
          required
        />
        <ErrorText message={fieldErrors.pincode} />
      </label>
      <label className={labelClass} htmlFor={id("country")}>
        Country
        <input
          id={id("country")}
          className={fieldClass}
          autoComplete="country-name"
          maxLength={80}
          value={value.country}
          onChange={(event) => onChange("country", event.target.value)}
          disabled={disabled}
        />
        <ErrorText message={fieldErrors.country} />
      </label>
    </div>
  );
}
