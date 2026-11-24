import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const COOKIE = "yousee_user";

function secret() {
  return process.env.SESSION_SECRET || "yousee-preview-session-secret-change-me";
}
function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export async function setUserSession(userId: string) {
  const payload = `${userId}.${Date.now()}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearUserSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export type SessionUser = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: "participant" | "admin";
  verified: boolean;
  provider: string;
  publicProfile: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const payload = `${parts[0]}.${parts[1]}`;
  const a = Buffer.from(sign(payload));
  const b = Buffer.from(parts[2]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (!/^[0-9a-f-]{36}$/.test(parts[0])) return null;
  if (Date.now() - Number(parts[1]) > 1000 * 60 * 60 * 24 * 14) return null;
  const [u] = await db.select().from(users).where(eq(users.id, parts[0])).limit(1);
  if (!u) return null;
  return {
    id: u.id,
    displayName: u.displayName,
    email: u.email,
    phone: u.phone,
    role: u.role === "admin" ? "admin" : "participant",
    verified: u.verified,
    provider: u.provider,
    publicProfile: u.publicProfile,
  };
}

export function recognitionLevel(points: number) {
  if (points >= 300) return { label: "Climate Justice Leader", next: null, remaining: 0 };
  if (points >= 150) return { label: "Community Steward", next: "Climate Justice Leader", remaining: 300 - points };
  if (points >= 60) return { label: "Active Contributor", next: "Community Steward", remaining: 150 - points };
  if (points > 0) return { label: "New Contributor", next: "Active Contributor", remaining: 60 - points };
  return { label: "Getting started", next: "New Contributor", remaining: 1 };
}
