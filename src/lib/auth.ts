import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getCurrentUser } from "./user-auth";

/**
 * Minimal moderator auth for the MVP. A shared passcode (ADMIN_PASSCODE) issues an
 * HMAC-signed, httpOnly cookie. Replace with Supabase Auth / role-based accounts
 * before production use with multiple moderators.
 */
const COOKIE = "yousee_admin";
const DEV_PASSCODE = "yousee-demo-admin";

export function adminPasscode() {
  return process.env.ADMIN_PASSCODE || DEV_PASSCODE;
}
export function usingDefaultPasscode() {
  return !process.env.ADMIN_PASSCODE;
}
function secret() {
  return process.env.SESSION_SECRET || `yousee-local-secret:${adminPasscode()}`;
}
function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function checkPasscode(input: string) {
  const a = Buffer.from(input);
  const b = Buffer.from(adminPasscode());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setAdminSession(name: string) {
  const payload = `${encodeURIComponent(name || "moderator")}.${Date.now()}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getAdmin(): Promise<{ name: string; userId?: string } | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) {
    const parts = raw.split(".");
    if (parts.length === 3) {
      const payload = `${parts[0]}.${parts[1]}`;
      if (sign(payload) === parts[2] && Date.now() - Number(parts[1]) < 1000 * 60 * 60 * 8) {
        return { name: decodeURIComponent(parts[0]) };
      }
    }
  }
  // Manually issued, verified admin accounts also grant dashboard access. Social accounts never do.
  const user = await getCurrentUser();
  if (user?.role === "admin" && user.verified) return { name: user.displayName, userId: user.id };
  return null;
}
