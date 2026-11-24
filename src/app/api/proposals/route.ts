import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { initiatives, proposals } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { CATEGORIES } from "@/lib/domain";
import { redactPII } from "@/lib/privacy";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  initiative: z.enum(["yousee", "shelens"]),
  title: z.string().trim().min(5).max(140),
  description: z.string().trim().min(20).max(2000),
  category: z.enum(CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  areaId: z.string().uuid().nullable().optional(),
  insightId: z.string().uuid().nullable().optional(),
  authorPseudonym: z.string().trim().max(40).nullable().optional(),
  action: z.literal("create").optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  // support action
  if (json && json.action === "support" && typeof json.id === "string") {
    await db.update(proposals).set({ supportCount: sql`${proposals.supportCount} + 1` }).where(eq(proposals.id, json.id));
    return NextResponse.json({ ok: true });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Please check the proposal fields.", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  const d = parsed.data;
  const [ini] = await db.select().from(initiatives).where(eq(initiatives.slug, d.initiative));
  const user = await getCurrentUser();
  const [row] = await db
    .insert(proposals)
    .values({
      userId: user?.id ?? null,
      initiativeId: ini?.id ?? null,
      title: redactPII(d.title),
      description: redactPII(d.description),
      category: d.category,
      areaId: d.areaId || null,
      insightId: d.insightId || null,
      authorPseudonym: d.authorPseudonym || null,
      status: "proposed",
      moderation: "pending",
    })
    .returning({ id: proposals.id });
  return NextResponse.json({ id: row.id });
}
