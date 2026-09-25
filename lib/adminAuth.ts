const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
export const ADMIN_COOKIE_NAME = "malmi_admin_session";

/** Simple server-side hash function for session signature */
async function createSignature(data: string): Promise<string> {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SESSION_SECRET);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(data)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Create a signed session token */
export async function createAdminToken(email: string): Promise<string> {
  const timestamp = Date.now();
  const payload = `${email}:${timestamp}`;
  const signature = await createSignature(payload);
  return `${payload}:${signature}`;
}

/** Verify a signed session token */
export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token || !ADMIN_EMAIL || !SESSION_SECRET) return false;
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return false;
    const [email, timestampStr, signature] = parts;
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return false;

    // Check expiration (24 hours)
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      return false;
    }

    const expectedSignature = await createSignature(`${email}:${timestampStr}`);
    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/** Server-side authentication check for route handlers / API */
export async function authenticateAdminRequest(email: string, pass: string): Promise<boolean> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return false;
  const cleanEmail = email.trim().toLowerCase();
  const targetEmail = ADMIN_EMAIL.trim().toLowerCase();
  return cleanEmail === targetEmail && pass === ADMIN_PASSWORD;
}
