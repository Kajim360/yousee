import { db } from "@/db";
import { contributionMedia, contributions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Serves a contribution photo. Public only for approved + public records; moderators can see all. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const admin = await getAdmin();
  const [row] = await db
    .select({ mime: contributionMedia.mimeType, data: contributionMedia.dataBase64 })
    .from(contributionMedia)
    .innerJoin(contributions, eq(contributions.id, contributionMedia.contributionId))
    .where(
      admin
        ? eq(contributionMedia.contributionId, id)
        : and(eq(contributionMedia.contributionId, id), eq(contributions.status, "approved"), eq(contributions.privacyClass, "public"))
    )
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(row.data, "base64"), {
    headers: { "content-type": row.mime, "cache-control": admin ? "private, no-store" : "public, max-age=3600" },
  });
}
