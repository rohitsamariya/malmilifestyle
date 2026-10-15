/**
 * Saved shipping address data access.
 *
 * Ownership is enforced by scoping every query to a customerId that is derived
 * server-side from the verified session — a client-supplied customer id is never
 * accepted. Addresses live as an embedded array on the Customer document, so a
 * lookup by address id is always a lookup *within* the caller's own document:
 * a foreign address id simply matches nothing and is reported as `404`.
 */

import mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import CustomerModel, { type ICustomerAddress } from "@/models/Customer";
import type { IOrderAddress } from "@/models/Order";
import { CustomerValidationError } from "@/lib/customer-validation";
import { MAX_ADDRESSES, type AddressLabel } from "@/lib/address-constants";
import {
  composeAddressLines,
  parseAddressUpdateInput,
  parseNewAddressInput,
} from "@/lib/address-validation";

/** The only saved-address shape that is ever allowed to leave the server. */
export interface CustomerAddressDTO {
  id: string;
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

export interface CreateAddressResult {
  addresses: CustomerAddressDTO[];
  createdId: string;
}

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

function toObjectId(value: string): mongoose.Types.ObjectId | null {
  return OBJECT_ID_PATTERN.test(value) ? new mongoose.Types.ObjectId(value) : null;
}

function toAddressDTO(address: ICustomerAddress): CustomerAddressDTO {
  return {
    id: String(address._id),
    label: (address.label ?? "Home") as AddressLabel,
    fullName: address.fullName ?? "",
    phone: address.phone ?? "",
    house: address.house ?? "",
    building: address.building ?? "",
    locality: address.locality ?? "",
    landmark: address.landmark ?? "",
    city: address.city ?? "",
    state: address.state ?? "",
    pincode: address.pincode ?? "",
    country: address.country ?? "India",
    isDefault: address.isDefault === true,
  };
}

/**
 * Flips `isDefault` to exactly one address in a single atomic update. A pipeline
 * update is used so the "clear every other flag, set this one" step cannot
 * interleave with a concurrent write and leave two defaults behind.
 */
async function applyDefault(
  customerId: mongoose.Types.ObjectId | string,
  addressId: mongoose.Types.ObjectId,
): Promise<void> {
  await CustomerModel.updateOne(
    { _id: customerId, "addresses._id": addressId },
    [
      {
        $set: {
          addresses: {
            $map: {
              input: "$addresses",
              as: "address",
              in: {
                $mergeObjects: [
                  "$$address",
                  { isDefault: { $eq: ["$$address._id", addressId] } },
                ],
              },
            },
          },
        },
      },
    ],
    { updatePipeline: true },
  );
}

async function readAddresses(customerId: mongoose.Types.ObjectId | string) {
  const customer = await CustomerModel.findById(customerId).select("addresses").lean();
  return (customer?.addresses ?? []).map(toAddressDTO);
}

export async function listCustomerAddresses(
  customerId: mongoose.Types.ObjectId | string,
): Promise<CustomerAddressDTO[]> {
  await connectToDatabase();
  return readAddresses(customerId);
}

/** Adds an address. The first address (or an explicit default) becomes default. */
export async function createCustomerAddress(
  customerId: mongoose.Types.ObjectId | string,
  rawInput: unknown,
): Promise<CreateAddressResult> {
  const input = parseNewAddressInput(rawInput);
  await connectToDatabase();

  const customer = await CustomerModel.findById(customerId).select("addresses").lean();
  if (!customer) {
    throw new CustomerValidationError("Your account could not be found.", 404);
  }
  const existing = customer.addresses ?? [];
  if (existing.length >= MAX_ADDRESSES) {
    throw new CustomerValidationError(
      `You can save up to ${MAX_ADDRESSES} addresses. Remove one to add another.`,
      409,
    );
  }

  const makeDefault = input.isDefault || existing.length === 0;

  const updated = await CustomerModel.findOneAndUpdate(
    { _id: customerId },
    { $push: { addresses: { ...input, isDefault: false } } },
    { returnDocument: "after", runValidators: true },
  ).lean();

  const addresses = updated?.addresses ?? [];
  const created = addresses[addresses.length - 1]
    ?? (await CustomerModel.findById(customerId).select("addresses").lean())?.addresses?.at(-1);

  const createdId = created?._id ? String(created._id) : "";
  if (makeDefault && createdId) {
    await applyDefault(customerId, new mongoose.Types.ObjectId(createdId));
  }

  return { addresses: await readAddresses(customerId), createdId };
}

export async function updateCustomerAddress(
  customerId: mongoose.Types.ObjectId | string,
  addressId: string,
  rawInput: unknown,
): Promise<CustomerAddressDTO[]> {
  const update = parseAddressUpdateInput(rawInput);
  await connectToDatabase();

  const oid = toObjectId(addressId);
  if (!oid) throw new CustomerValidationError("Address not found.", 404);

  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(update)) {
    if (key === "isDefault") continue;
    fields[`addresses.$.${key}`] = value;
  }

  if (Object.keys(fields).length > 0) {
    const updated = await CustomerModel.findOneAndUpdate(
      { _id: customerId, "addresses._id": oid },
      { $set: fields },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!updated) throw new CustomerValidationError("Address not found.", 404);
  } else {
    const exists = await CustomerModel.exists({ _id: customerId, "addresses._id": oid });
    if (!exists) throw new CustomerValidationError("Address not found.", 404);
  }

  if (update.isDefault === true) {
    await applyDefault(customerId, oid);
  }

  return readAddresses(customerId);
}

/** Removes an address. Deleting the default promotes the next address. */
export async function deleteCustomerAddress(
  customerId: mongoose.Types.ObjectId | string,
  addressId: string,
): Promise<CustomerAddressDTO[]> {
  await connectToDatabase();

  const oid = toObjectId(addressId);
  if (!oid) throw new CustomerValidationError("Address not found.", 404);

  const customer = await CustomerModel.findOne({ _id: customerId, "addresses._id": oid })
    .select("addresses")
    .lean();
  if (!customer) throw new CustomerValidationError("Address not found.", 404);

  const wasDefault = (customer.addresses ?? []).some(
    (address: ICustomerAddress) => String(address._id) === String(oid) && address.isDefault === true,
  );

  const updated = await CustomerModel.findByIdAndUpdate(
    customerId,
    { $pull: { addresses: { _id: oid } } },
    { returnDocument: "after" },
  ).lean();

  const remaining = updated?.addresses ?? [];
  if (wasDefault && remaining.length > 0) {
    await applyDefault(customerId, remaining[0]._id as mongoose.Types.ObjectId);
  }

  return readAddresses(customerId);
}

export async function setDefaultCustomerAddress(
  customerId: mongoose.Types.ObjectId | string,
  addressId: string,
): Promise<CustomerAddressDTO[]> {
  await connectToDatabase();

  const oid = toObjectId(addressId);
  if (!oid) throw new CustomerValidationError("Address not found.", 404);

  const exists = await CustomerModel.exists({ _id: customerId, "addresses._id": oid });
  if (!exists) throw new CustomerValidationError("Address not found.", 404);

  await applyDefault(customerId, oid);
  return readAddresses(customerId);
}

function toOrderAddress(address: ICustomerAddress, email: string): IOrderAddress {
  const lines = composeAddressLines(address);
  return {
    fullName: address.fullName,
    phone: address.phone,
    email,
    addressLine1: lines.addressLine1,
    addressLine2: lines.addressLine2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    label: address.label,
    house: address.house ?? "",
    building: address.building ?? "",
    locality: address.locality ?? "",
    landmark: address.landmark ?? "",
    country: address.country ?? "India",
  };
}

/**
 * Resolves one of the customer's own saved addresses into an immutable order
 * snapshot. Returns `null` for a malformed, missing or foreign address id so the
 * caller can answer 404/400 without ever revealing another customer's data.
 * Accepts a session so it can participate in the order-creation transaction.
 */
export async function resolveShippingAddress(
  customerId: mongoose.Types.ObjectId | string,
  addressId: string,
  session?: mongoose.ClientSession,
): Promise<IOrderAddress | null> {
  const oid = toObjectId(addressId);
  if (!oid) return null;

  await connectToDatabase();
  const query = CustomerModel.findOne({ _id: customerId, "addresses._id": oid })
    .select("email addresses.$");
  if (session) query.session(session);
  const customer = await query.lean();

  const address = customer?.addresses?.[0];
  if (!address) return null;
  return toOrderAddress(address, customer?.email ?? "");
}
