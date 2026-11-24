import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { insights, validationRecords } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { redactPII } from "@/lib/privacy";

export const dynamic = "force-dynamic";

const schema = z.object({
  verdict: z.enum(["agree", "partially", "disagree"]),
  reviewerRole: z.enum(["resident", "facilitator", "researcher", "expert"]),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  const [ins] = await db.select({ id: insights.id }).from(insights).where(and(eq(insights.id, id), inArray(insights.status, ["in_review", "published"])));
  if (!ins) return NextResponse.json({ error: "Insight not open for review" }, { status: 404 });
  await db.insert(validationRecords).values({
    insightId: id,
    verdict: parsed.data.verdict,
    reviewerRole: parsed.data.reviewerRole,
    comment: parsed.data.comment ? redactPII(parsed.data.comment) : null,
  });
  return NextResponse.json({ ok: true });
}
