import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setUserSession } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  mode: z.enum(["login", "register"]),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(2).max(60).optional(),
});

export async function POST(req: Request) {
  await ensureSeed();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Use a valid email and a password of at least 8 characters." }, { status: 400 });
  const { mode, email, password, displayName } = parsed.data;
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (mode === "register") {
    if (!displayName) return NextResponse.json({ error: "A display name is required." }, { status: 400 });
    if (existing) return NextResponse.json({ error: "An account with this email already exists. Sign in instead." }, { status: 409 });
    const [u] = await db
      .insert(users)
      .values({ displayName, email, passwordHash: hashPassword(password), provider: "credentials", role: "participant", verified: false, verificationNote: "Password account; email not independently verified." })
      .returning();
    await setUserSession(u.id);
    return NextResponse.json({ ok: true, user: { id: u.id, displayName: u.displayName } });
  }

  if (!existing || !verifyPassword(password, existing.passwordHash)) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }
  await setUserSession(existing.id);
  return NextResponse.json({ ok: true, user: { id: existing.id, displayName: existing.displayName, role: existing.role } });
}
