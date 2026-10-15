/**
 * Shared constants for saved shipping addresses.
 *
 * Deliberately import-free so the Mongoose model, the pure validation layer,
 * the server service and the browser components can all agree on one source of
 * truth without pulling any runtime code into the client bundle or the model.
 */

export const ADDRESS_LABELS = ["Home", "Office", "Other"] as const;

export type AddressLabel = (typeof ADDRESS_LABELS)[number];

/** Per-customer cap. Keeps the embedded array and the address book UI sane. */
export const MAX_ADDRESSES = 10;
