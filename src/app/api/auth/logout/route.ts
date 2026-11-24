import { NextResponse } from "next/server";
import { clearUserSession } from "@/lib/user-auth";
import { clearAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await clearUserSession();
  await clearAdminSession();
  return NextResponse.redirect(new URL("/?notice=signed-out", req.url), 303);
}
