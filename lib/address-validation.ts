/**
 * Pure validation for saved shipping addresses.
 *
 * No database access and no browser APIs — every rule is unit testable in
 * isolation and is re-applied on the server, so client-side validation can never
 * be trusted. Mirrors the shape and error contract of `customer-validation.ts`.
 */

import { CustomerValidationError, isValidIndianPhone, normalizePhone } from "@/lib/customer-validation";
import { ADDRESS_LABELS, type AddressLabel } from "@/lib/address-constants";

interface FieldErrors {
  [field: string]: string;
}

export interface AddressFields {
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
  isDefault: boolean;
}

/** Fields the address book may edit. `isDefault` is managed by its own action. */
export type AddressUpdate = Partial<AddressFields>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasField(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function parseLabel(value: unknown, errors: FieldErrors): AddressLabel {
  if (value === undefined || value === null || value === "") return "Home";
  if (typeof value === "string" && (ADDRESS_LABELS as readonly string[]).includes(value)) {
    return value as AddressLabel;
  }
  errors.label = "Choose a valid address label.";
  return "Home";
}

function requiredText(
  value: unknown,
  key: string,
  label: string,
  maxLength: number,
  errors: FieldErrors,
): string {
  const text = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!text) {
    errors[key] = `${label} is required.`;
  } else if (text.length > maxLength) {
    errors[key] = `${label} must be ${maxLength} characters or fewer.`;
  }
  return text;
}

function optionalText(
  value: unknown,
  key: string,
  label: string,
  maxLength: number,
  errors: FieldErrors,
): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") {
    errors[key] = `${label} is invalid.`;
    return "";
  }
  const text = value.trim().replace(/\s+/g, " ");
  if (text.length > maxLength) {
    errors[key] = `${label} must be ${maxLength} characters or fewer.`;
  }
  return text;
}

function parsePhone(value: unknown, errors: FieldErrors): string {
  const phone = normalizePhone(value);
  if (!phone) {
    errors.phone = "Mobile number is required.";
  } else if (!isValidIndianPhone(phone)) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }
  return phone;
}

function parsePincode(value: unknown, errors: FieldErrors): string {
  const pincode = typeof value === "string" ? value.trim() : "";
  if (!/^\d{6}$/.test(pincode)) {
    errors.pincode = "Enter a valid 6-digit pincode.";
  }
  return pincode;
}

function throwIfInvalid(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) {
    throw new CustomerValidationError("Please correct the highlighted fields.", 400, errors);
  }
}

/** Validates a complete new address. Rejects the request before any write. */
export function parseNewAddressInput(value: unknown): AddressFields {
  if (!isRecord(value)) {
    throw new CustomerValidationError("Invalid address.", 400);
  }

  const errors: FieldErrors = {};
  const fields: AddressFields = {
    label: parseLabel(value.label, errors),
    fullName: requiredText(value.fullName, "fullName", "Full name", 100, errors),
    phone: parsePhone(value.phone, errors),
    house: requiredText(value.house, "house", "House / flat / building number", 200, errors),
    building: optionalText(value.building, "building", "Building / apartment", 200, errors),
    locality: optionalText(value.locality, "locality", "Area / locality", 120, errors),
    landmark: optionalText(value.landmark, "landmark", "Landmark", 120, errors),
    city: requiredText(value.city, "city", "City", 80, errors),
    state: requiredText(value.state, "state", "State", 80, errors),
    pincode: parsePincode(value.pincode, errors),
    country: optionalText(value.country, "country", "Country", 80, errors) || "India",
    isDefault: value.isDefault === true,
  };

  throwIfInvalid(errors);
  return fields;
}

/** Validates a partial address edit. Only the supplied fields are checked. */
export function parseAddressUpdateInput(value: unknown): AddressUpdate {
  if (!isRecord(value)) {
    throw new CustomerValidationError("Invalid address.", 400);
  }

  const errors: FieldErrors = {};
  const update: AddressUpdate = {};

  if (hasField(value, "label")) update.label = parseLabel(value.label, errors);
  if (hasField(value, "fullName")) {
    update.fullName = requiredText(value.fullName, "fullName", "Full name", 100, errors);
  }
  if (hasField(value, "phone")) update.phone = parsePhone(value.phone, errors);
  if (hasField(value, "house")) {
    update.house = requiredText(value.house, "house", "House / flat / building number", 200, errors);
  }
  if (hasField(value, "building")) {
    update.building = optionalText(value.building, "building", "Building / apartment", 200, errors);
  }
  if (hasField(value, "locality")) {
    update.locality = optionalText(value.locality, "locality", "Area / locality", 120, errors);
  }
  if (hasField(value, "landmark")) {
    update.landmark = optionalText(value.landmark, "landmark", "Landmark", 120, errors);
  }
  if (hasField(value, "city")) update.city = requiredText(value.city, "city", "City", 80, errors);
  if (hasField(value, "state")) update.state = requiredText(value.state, "state", "State", 80, errors);
  if (hasField(value, "pincode")) update.pincode = parsePincode(value.pincode, errors);
  if (hasField(value, "country")) {
    update.country = optionalText(value.country, "country", "Country", 80, errors) || "India";
  }
  if (hasField(value, "isDefault")) update.isDefault = value.isDefault === true;

  throwIfInvalid(errors);

  if (Object.keys(update).length === 0) {
    throw new CustomerValidationError("No changes to save.", 400);
  }
  return update;
}

/** Composes the free-text lines stored on an order from the structured parts. */
export function composeAddressLines(address: {
  house?: string;
  building?: string;
  locality?: string;
  landmark?: string;
}): { addressLine1: string; addressLine2: string } {
  const join = (parts: Array<string | undefined>) =>
    parts.map((part) => (part ?? "").trim()).filter(Boolean).join(", ");
  return {
    addressLine1: join([address.house, address.building]),
    addressLine2: join([address.locality, address.landmark]),
  };
}
