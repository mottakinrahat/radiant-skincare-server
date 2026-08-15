"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashEmail = hashEmail;
exports.hashPhone = hashPhone;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Hashes an email string according to Meta/TikTok CAPI requirements:
 * 1. Lowercase
 * 2. Trim whitespace
 * 3. SHA-256 hex digest
 */
function hashEmail(email) {
    if (!email || typeof email !== "string")
        return undefined;
    const cleaned = email.trim().toLowerCase();
    if (!cleaned)
        return undefined;
    return crypto_1.default.createHash("sha256").update(cleaned).digest("hex");
}
/**
 * Hashes a phone number according to Meta/TikTok CAPI requirements:
 * 1. Strip all non-digit characters (digits-only, E.164 style)
 * 2. SHA-256 hex digest
 */
function hashPhone(phone) {
    if (!phone || typeof phone !== "string")
        return undefined;
    let digits = phone.replace(/[^\d]/g, "");
    if (!digits)
        return undefined;
    // If local Bangladeshi number (starts with 01...), prepend 880 for E.164 format
    if (digits.length === 11 && digits.startsWith("01")) {
        digits = `880${digits.substring(1)}`;
    }
    return crypto_1.default.createHash("sha256").update(digits).digest("hex");
}
