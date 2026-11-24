import { createHmac, createSign, randomBytes } from "crypto";
import type { SessionUser } from "./user-auth";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export type Provider = "google" | "apple" | "facebook";

export function providerConfigured(p: Provider) {
  const env = process.env;
  if (p === "google") return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  if (p === "facebook") return Boolean(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET);
  return Boolean(env.APPLE_CLIENT_ID && env.APPLE_TEAM_ID && env.APPLE_KEY_ID && env.APPLE_PRIVATE_KEY);
}

export function providerLabel(p: string) {
  return p === "google" ? "Google" : p === "apple" ? "Apple" : p === "facebook" ? "Facebook" : p;
}

function stateSecret() {
  return process.env.SESSION_SECRET || "yousee-preview-session-secret-change-me";
}
export function makeState(provider: Provider) {
  const value = `${provider}.${randomBytes(16).toString("hex")}.${Date.now()}`;
  const sig = createHmac("sha256", stateSecret()).update(value).digest("hex");
  return `${value}.${sig}`;
}
export function verifyState(raw: string | undefined, provider: Provider) {
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 4 || parts[0] !== provider) return false;
  const value = parts.slice(0, 3).join(".");
  const expected = createHmac("sha256", stateSecret()).update(value).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[3]);
  return timingSafeEqualLocal(a, b) && Date.now() - Number(parts[2]) < 10 * 60 * 1000;
}
function timingSafeEqualLocal(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function authUrl(p: Provider, redirectUri: string, state: string) {
  const u = new URL(
    p === "google"
      ? "https://accounts.google.com/o/oauth2/v2/auth"
      : p === "facebook"
        ? "https://www.facebook.com/v19.0/dialog/oauth"
        : "https://appleid.apple.com/auth/authorize"
  );
  const clientId = p === "google" ? process.env.GOOGLE_CLIENT_ID! : p === "facebook" ? process.env.FACEBOOK_APP_ID! : process.env.APPLE_CLIENT_ID!;
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("state", state);
  if (p === "google") u.searchParams.set("scope", "openid email profile");
  if (p === "facebook") u.searchParams.set("scope", "email,public_profile");
  // Apple: code-only query callback so the state cookie works on a normal HTTPS redirect.
  if (p === "apple") u.searchParams.set("response_mode", "query");
  return u.toString();
}

function base64url(obj: object | Buffer) {
  return Buffer.from(typeof obj === "string" ? obj : JSON.stringify(obj)).toString("base64url");
}

/** Apple requires a short-lived ES256 client secret signed with the private key from the developer account. */
function appleClientSecret() {
  const key = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url({ alg: "ES256", kid: process.env.APPLE_KEY_ID, typ: "JWT" });
  const payload = base64url({
    iss: process.env.APPLE_TEAM_ID,
    iat: now,
    exp: now + 300,
    aud: "https://appleid.apple.com",
    sub: process.env.APPLE_CLIENT_ID,
  });
  const data = `${header}.${payload}`;
  const signature = createSign("SHA256").update(data).sign({ key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return `${data}.${signature}`;
}

type Profile = { subject: string; name: string; email: string | null };

export async function exchangeCode(p: Provider, code: string, redirectUri: string): Promise<Profile | null> {
  try {
    if (p === "google") {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) return null;
      const token = (await tokenRes.json()) as { access_token: string };
      const r = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (!r.ok) return null;
      const j = (await r.json()) as { sub: string; name?: string; email?: string };
      return { subject: j.sub, name: j.name ?? j.email?.split("@")[0] ?? "Participant", email: j.email ?? null };
    }
    if (p === "facebook") {
      const u = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
      u.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
      u.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET!);
      u.searchParams.set("redirect_uri", redirectUri);
      u.searchParams.set("code", code);
      const tokenRes = await fetch(u);
      if (!tokenRes.ok) return null;
      const token = (await tokenRes.json()) as { access_token: string };
      const g = new URL("https://graph.facebook.com/me");
      g.searchParams.set("fields", "id,name,email");
      g.searchParams.set("access_token", token.access_token);
      const r = await fetch(g);
      if (!r.ok) return null;
      const j = (await r.json()) as { id: string; name?: string; email?: string };
      return { subject: j.id, name: j.name ?? "Participant", email: j.email ?? null };
    }
    const body = new URLSearchParams({
      code,
      client_id: process.env.APPLE_CLIENT_ID!,
      client_secret: appleClientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!tokenRes.ok) return null;
    const token = (await tokenRes.json()) as { id_token: string };
    const payload = JSON.parse(Buffer.from(token.id_token.split(".")[1], "base64url").toString()) as { sub: string; email?: string };
    return { subject: payload.sub, name: payload.email?.split("@")[0] ?? "Participant", email: payload.email ?? null };
  } catch (e) {
    console.error("OAuth exchange failed", e);
    return null;
  }
}

/** Upsert by provider subject, never by email alone (prevents account takeover). */
export async function upsertOAuthUser(p: Provider, profile: Profile) {
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.provider, p), eq(users.providerSubject, profile.subject)))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(users)
    .values({
      displayName: profile.name.slice(0, 60),
      email: profile.email,
      provider: p,
      providerSubject: profile.subject,
      role: "participant",
      verified: true,
      verificationNote: `Verified by ${providerLabel(p)} OAuth`,
    })
    .returning();
  return created;
}

export function publicUser(u: Awaited<ReturnType<typeof upsertOAuthUser>>): Omit<SessionUser, "id"> & { id: string } {
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
