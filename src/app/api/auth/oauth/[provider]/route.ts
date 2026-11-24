import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authUrl, makeState, providerConfigured, type Provider } from "@/lib/oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (!["google", "apple", "facebook"].includes(provider)) return NextResponse.redirect(new URL("/login?notice=unknown-provider", req.url));
  const p = provider as Provider;
  if (!providerConfigured(p)) return NextResponse.redirect(new URL(`/login?notice=not-configured&provider=${p}`, req.url));
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/oauth/${p}/callback`;
  const state = makeState(p);
  const jar = await cookies();
  jar.set("yousee_oauth_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return NextResponse.redirect(authUrl(p, redirectUri, state));
}
