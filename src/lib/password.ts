import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

/** scrypt with a per-password salt. Format: scrypt$<salt>$<hash>. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const expected = Buffer.from(parts[2], "hex");
    const actual = scryptSync(password, parts[1], expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function hashOtp(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}:yousee-otp`).digest("hex");
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
