import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { ensureSeed } from "@/lib/seed";
import { generateOtp, hashOtp } from "@/lib/password";

export const dynamic = "force-dynamic";
const schema = z.object({ phone: z.string().trim().regex(/^\+?[0-9 ]{8,18}$/) });
const requests = new Map<string, number[]>();

export async function POST(req: Request) {
  await ensureSeed();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a phone number in international format, e.g. +628123456789." }, { status: 400 });
  const phone = parsed.data.phone.replace(/\s/g, "");
  const now = Date.now();
  const arr = (requests.get(phone) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  if (arr.length >= 5) return NextResponse.json({ error: "Too many codes requested. Try again in 10 minutes." }, { status: 429 });
  arr.push(now);
  requests.set(phone, arr);

  const code = generateOtp();
  await db.insert(otpCodes).values({
    phone,
    codeHash: hashOtp(phone, code),
    expiresAt: new Date(now + 10 * 60 * 1000),
  });

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (sid && token && from) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: phone, From: from, Body: `Your YouSee verification code is ${code}. It expires in 10 minutes.` }),
    });
    if (!res.ok) return NextResponse.json({ error: "The SMS provider could not send the code. Please try again later." }, { status: 502 });
    return NextResponse.json({ ok: true, delivery: "sms" });
  }

  // Honest demo behaviour: no SMS provider is configured, so the code is shown locally.
  return NextResponse.json({ ok: true, delivery: "demo", demoCode: code, notice: "No SMS provider is configured, so the code is shown here for this preview. In production it is sent by SMS and never returned to the browser." });
}
