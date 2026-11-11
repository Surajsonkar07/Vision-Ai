import crypto from "crypto";

/**
 * Converts an email into a deterministic UUID v4 format string using SHA-256
 * to guarantee PostgreSQL uuid type compatibility.
 */
export function emailToUuid(email: string): string {
  const hash = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}
