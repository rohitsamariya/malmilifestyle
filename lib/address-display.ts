/**
 * Presentation helper for a saved address. Pure and import-free so it is safe
 * to use in both server and client components.
 */

export interface AddressLike {
  house?: string;
  building?: string;
  locality?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

/** Joins the structured parts into one display line, skipping empty parts. */
export function formatAddressSummary(address: AddressLike): string {
  return [
    address.house,
    address.building,
    address.locality,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(", ");
}
