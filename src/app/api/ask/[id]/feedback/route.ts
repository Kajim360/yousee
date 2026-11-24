import { NextResponse } from "next/server";
import { db } from "@/db";
import { askLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { helpful?: boolean };
  if (typeof body.helpful !== "boolean") return NextResponse.json({ error: "helpful must be boolean" }, { status: 400 });
  await db.update(askLogs).set({ helpful: body.helpful }).where(eq(askLogs.id, id));
  return NextResponse.json({ ok: true });
}
