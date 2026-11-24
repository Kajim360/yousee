import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { activities } from "@/db/schema";
import { getCurrentUser } from "@/lib/user-auth";
import { ACTIVITY_KINDS } from "@/lib/domain";
import { redactPII } from "@/lib/privacy";

export const dynamic = "force-dynamic";

const schema = z.object({
  kind: z.enum(ACTIVITY_KINDS.map((k) => k.id) as [string, ...string[]]),
  title: z.string().trim().min(5).max(140),
  description: z.string().trim().min(20).max(2000),
  evidenceUrl: z.string().trim().url().max(500).nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit an action for recognition." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the form. A description of 20+ characters and a valid evidence link are required.", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  const d = parsed.data;
  const [row] = await db
    .insert(activities)
    .values({
      userId: user.id,
      kind: d.kind,
      title: redactPII(d.title),
      description: redactPII(d.description),
      evidenceUrl: d.evidenceUrl || null,
    })
    .returning({ id: activities.id });
  return NextResponse.json({ ok: true, id: row.id });
}
