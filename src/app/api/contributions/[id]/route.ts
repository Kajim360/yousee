import { NextResponse } from "next/server";
import { db } from "@/db";
import { contributions, moderationRecords } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { hashToken } from "@/lib/privacy";

export const dynamic = "force-dynamic";

/** Status lookup for the contributor (requires their private token). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const [row] = await db
    .select({ id: contributions.id, title: contributions.title, status: contributions.status, createdAt: contributions.createdAt })
    .from(contributions)
    .where(and(eq(contributions.id, id), eq(contributions.deleteTokenHash, hashToken(token))));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

/** Self-service deletion — removes the record, consent, media and AI outputs (cascade). */
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { token?: string };
  if (!body.token) return NextResponse.json({ error: "Token required" }, { status: 400 });
  const deleted = await db
    .delete(contributions)
    .where(and(eq(contributions.id, id), eq(contributions.deleteTokenHash, hashToken(body.token))))
    .returning({ id: contributions.id });
  if (!deleted.length) return NextResponse.json({ error: "Not found or token invalid" }, { status: 404 });
  await db.insert(moderationRecords).values({ targetType: "contribution", targetId: id, action: "deleted_by_contributor", actor: "contributor" });
  return NextResponse.json({ ok: true });
}
