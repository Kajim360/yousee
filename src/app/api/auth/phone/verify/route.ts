import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes, users } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { hashOtp } from "@/lib/password";
import { setUserSession } from "@/lib/user-auth";

export const dynamic = "force-dynamic";
const schema = z.object({
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,18}$/),
  code: z.string().trim().regex(/^[0-9]{6}$/),
  displayName: z.string().trim().min(2).max(60).optional(),
});

export async function POST(req: Request) {
  await ensureSeed();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  const phone = parsed.data.phone.replace(/\s/g, "");
  const [latest] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.expiresAt, new Date())))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!latest || latest.attempts >= 5) return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
  if (hashOtp(phone, parsed.data.code) !== latest.codeHash) {
    await db.update(otpCodes).set({ attempts: latest.attempts + 1 }).where(eq(otpCodes.id, latest.id));
    return NextResponse.json({ error: "Incorrect code." }, { status: 401 });
  }
  await db.delete(otpCodes).where(eq(otpCodes.phone, phone));

  const [existing] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  let userId: string;
  if (existing) {
    userId = existing.id;
    await db.update(users).set({ verified: true, verificationNote: "Phone verified by OTP" }).where(eq(users.id, userId));
  } else {
    const [u] = await db
      .insert(users)
      .values({
        displayName: parsed.data.displayName || `Participant ${phone.slice(-4)}`,
        phone,
        provider: "phone",
        role: "participant",
        verified: true,
        verificationNote: "Phone verified by OTP",
      })
      .returning();
    userId = u.id;
  }
  await setUserSession(userId);
  return NextResponse.json({ ok: true });
}
