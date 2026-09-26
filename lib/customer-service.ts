/**
 * Customer account lifecycle: registration, credential verification and
 * lookup. Passwords are hashed with bcrypt before they ever reach MongoDB and
 * are never logged, returned or stored in plaintext.
 */

import connectToDatabase from "@/lib/db";
import CustomerModel from "@/models/Customer";
import { toCustomerDTO, type CustomerDTO } from "@/lib/customerAuth";
import {
  CustomerValidationError,
  hashPassword,
  parseLoginInput,
  parseRegisterInput,
  verifyPassword,
  type LoginInput,
  type RegisterInput,
} from "@/lib/customer-validation";

/** Single generic message so responses never reveal whether an email is registered. */
export const INVALID_CREDENTIALS_MESSAGE = "Incorrect email or password.";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}

/** Creates a customer account. Phone is stored but never treated as verified. */
export async function registerCustomer(rawInput: unknown): Promise<CustomerDTO> {
  const input: RegisterInput = parseRegisterInput(rawInput);
  await connectToDatabase();

  const existing = await CustomerModel.findOne({ email: input.email }).lean();
  if (existing) {
    throw new CustomerValidationError(
      "An account with this email already exists.",
      409,
      { email: "An account with this email already exists." },
    );
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const customer = await CustomerModel.create({
      email: input.email,
      passwordHash,
      fullName: input.name,
      phone: input.phone,
      phoneVerified: false,
      isActive: true,
    });
    return toCustomerDTO(customer.toObject());
  } catch (error) {
    // Lost the race against a concurrent signup for the same email.
    if (isDuplicateKeyError(error)) {
      throw new CustomerValidationError(
        "An account with this email already exists.",
        409,
        { email: "An account with this email already exists." },
      );
    }
    throw error;
  }
}

/**
 * Verifies credentials for an active customer.
 * Returns null for unknown email, wrong password and deactivated accounts alike.
 */
export async function authenticateCustomer(rawInput: unknown): Promise<CustomerDTO | null> {
  const input: LoginInput = parseLoginInput(rawInput);
  await connectToDatabase();

  const customer = await CustomerModel.findOne({ email: input.email })
    .select("+passwordHash")
    .lean();

  const passwordMatches = await verifyPassword(
    input.password,
    customer?.passwordHash ?? "",
  );
  if (!customer || !passwordMatches || customer.isActive === false) {
    return null;
  }

  return toCustomerDTO(customer);
}

/** Used by the profile page and admin tooling; never exposes the hash. */
export async function getCustomerById(customerId: string): Promise<CustomerDTO | null> {
  await connectToDatabase();
  const customer = await CustomerModel.findById(customerId).lean();
  return customer ? toCustomerDTO(customer) : null;
}
