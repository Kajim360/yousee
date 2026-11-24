import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, providerConfigured, verifyState, upsertOAuthUser, type Provider } from "@/lib/oauth";
import { ensureSeed } from "@/lib/seed";
import { setUserSession } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

async function handle(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const fail = (reason: string) => NextResponse.redirect(new URL(`/login?notice=${reason}&provider=${provider}`, req.url));
  if (!["google", "apple", "facebook"].includes(provider)) return fail("unknown-provider");
  const p = provider as Provider;
  if (!providerConfigured(p)) return fail("not-configured");
  await ensureSeed();

  const url = new URL(req.url);
  let code = url.searchParams.get("code");
  let state = url.searchParams.get("state");
  if (req.method === "POST") {
    const form = await req.formData().catch(() => null);
    if (form) {
      code = String(form.get("code") ?? code ?? "");
      state = String(form.get("state") ?? state ?? "");
    }
  }
  const jar = await cookies();
  const cookieState = jar.get("yousee_oauth_state")?.value;
  jar.delete("yousee_oauth_state");
  if (!code || !state || !cookieState || state !== cookieState || !verifyState(cookieState, p)) return fail("oauth-state");
  if (url.searchParams.has("error")) return fail("oauth-denied");

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || url.origin;
  const redirectUri = `${origin}/api/auth/oauth/${p}/callback`;
  const profile = await exchangeCode(p, code, redirectUri);
  if (!profile) return fail("oauth-failed");
  const user = await upsertOAuthUser(p, profile);
  if (user.role === "admin") return fail("admin-not-allowed"); // admin accounts are never social accounts
  await setUserSession(user.id);
  return NextResponse.redirect(new URL("/account", req.url));
}

export const GET = handle;
export const POST = handle;
