import crypto from "crypto";

/**
 * Hashes an email string according to Meta/TikTok CAPI requirements:
 * 1. Lowercase
 * 2. Trim whitespace
 * 3. SHA-256 hex digest
 */
export function hashEmail(email?: string): string | undefined {
  if (!email || typeof email !== "string") return undefined;
  const cleaned = email.trim().toLowerCase();
  if (!cleaned) return undefined;
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

/**
 * Hashes a phone number according to Meta/TikTok CAPI requirements:
 * 1. Strip all non-digit characters (digits-only, E.164 style)
 * 2. SHA-256 hex digest
 */
export function hashPhone(phone?: string): string | undefined {
  if (!phone || typeof phone !== "string") return undefined;
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return undefined;

  // If local Bangladeshi number (starts with 01...), prepend 880 for E.164 format
  if (digits.length === 11 && digits.startsWith("01")) {
    digits = `880${digits.substring(1)}`;
  }

  return crypto.createHash("sha256").update(digits).digest("hex");
}
