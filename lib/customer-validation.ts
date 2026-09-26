/**
 * Pure validation for customer registration, login and post-auth redirects.
 * No database access — every rule here is unit testable in isolation and is
 * re-applied on the server so client-side validation can never be trusted.
 */

import { compare, hash } from "bcryptjs";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 80;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_MOBILE_PATTERN = /^(?:\+91)?[6-9]\d{9}$/;

/** bcrypt work factor. 12 rounds is the current OWASP recommendation for bcrypt. */
const PASSWORD_HASH_ROUNDS = 12;

/**
 * A real bcrypt hash of a value nobody can guess. Comparing against it when the
 * customer does not exist keeps unknown-email logins as slow as known ones, so
 * response timing does not reveal which emails are registered.
 */
const DUMMY_PASSWORD_HASH = "$2b$12$K0Qbc5VGFBOGm9NAhTec7.bNiagunrmNVdPvIgGLLpxzu8A2nZouy";

export class CustomerValidationError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "CustomerValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** Strips formatting characters and an optional +91 prefix, leaving 10 digits. */
export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  const digits = value.replace(/[\s()\-.]/g, "");
  return digits.startsWith("+91") ? digits.slice(3) : digits;
}

export function isValidIndianPhone(value: unknown): boolean {
  return INDIAN_MOBILE_PATTERN.test(normalizePhone(value));
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export function parseRegisterInput(value: unknown): RegisterInput {
  if (!isRecord(value)) {
    throw new CustomerValidationError("Invalid registration request.", 400);
  }

  const fieldErrors: Record<string, string> = {};

  const name = typeof value.name === "string" ? value.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < MIN_NAME_LENGTH) {
    fieldErrors.name = "Enter your full name.";
  } else if (name.length > MAX_NAME_LENGTH) {
    fieldErrors.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  const email = normalizeEmail(value.email);
  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  const phone = normalizePhone(value.phone);
  if (!phone) {
    fieldErrors.phone = "Mobile number is required.";
  } else if (!INDIAN_MOBILE_PATTERN.test(phone)) {
    fieldErrors.phone = "Enter a valid 10-digit Indian mobile number.";
  }

  const password = typeof value.password === "string" ? value.password : "";
  if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  } else if (password.length > MAX_PASSWORD_LENGTH) {
    fieldErrors.password = "Password is too long.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new CustomerValidationError("Please correct the highlighted fields.", 400, fieldErrors);
  }

  return { name, email, password, phone };
}

export interface LoginInput {
  email: string;
  password: string;
}

export function parseLoginInput(value: unknown): LoginInput {
  if (!isRecord(value)) {
    throw new CustomerValidationError("Invalid login request.", 400);
  }

  const email = normalizeEmail(value.email);
  const password = typeof value.password === "string" ? value.password : "";

  const fieldErrors: Record<string, string> = {};
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (!password) {
    fieldErrors.password = "Password is required.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new CustomerValidationError("Please correct the highlighted fields.", 400, fieldErrors);
  }

  return { email, password };
}

/** Hashes a plaintext password. The plaintext is never stored or logged. */
export function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_HASH_ROUNDS);
}

/** Constant-time comparison performed by bcrypt. */
export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!passwordHash) {
    // Still burn a comparison so unknown-email logins cost the same as known ones.
    return compare(password, DUMMY_PASSWORD_HASH);
  }
  return compare(password, passwordHash);
}
