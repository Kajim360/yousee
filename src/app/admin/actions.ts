"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  aiInterpretations,
  areas,
  consentRecords,
  contributions,
  evidenceSources,
  initiatives,
  insightContributions,
  insightSources,
  insights,
  moderationRecords,
  proposals,
  validationRecords,
  rewards,
  users,
} from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { ensureSeed } from "@/lib/seed";
import { checkPasscode, clearAdminSession, getAdmin, setAdminSession } from "@/lib/auth";
import { clearUserSession } from "@/lib/user-auth";
import { draftInsight, emotionDistribution, PROMPT_VERSIONS } from "@/lib/ai";
import { PROPOSAL_STATUSES } from "@/lib/domain";

async function requireAdmin() {
  const a = await getAdmin();
  if (!a) redirect("/admin");
  return a;
}
function s(fd: FormData, k: string) {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function loginAction(fd: FormData) {
  if (!checkPasscode(s(fd, "passcode"))) redirect("/admin?error=1");
  await setAdminSession(s(fd, "name") || "moderator");
  redirect("/admin");
}

/** Verified admin accounts use manually issued credentials — never social login. */
export async function adminCredentialLogin(fd: FormData) {
  await ensureSeed();
  const email = s(fd, "email").toLowerCase();
  const password = s(fd, "password");
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!u || u.role !== "admin" || !u.verified || !verifyPassword(password, u.passwordHash)) {
    redirect("/admin?error=admin");
  }
  await setAdminSession(u.displayName);
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  await clearUserSession();
  redirect("/admin");
}

export async function moderateContribution(fd: FormData) {
  const admin = await requireAdmin();
  const id = s(fd, "id");
  const action = s(fd, "action");
  if (!["approved", "rejected", "flagged", "pending"].includes(action)) return;
  await db.update(contributions).set({ status: action }).where(eq(contributions.id, id));
  await db.insert(moderationRecords).values({ contributionId: id, targetType: "contribution", targetId: id, action: `status:${action}`, note: s(fd, "note") || null, actor: admin.name });
  if (action === "approved") {
    const [c] = await db.select({ userId: contributions.userId, title: contributions.title }).from(contributions).where(eq(contributions.id, id));
    if (c?.userId) {
      const [prior] = await db
        .select({ id: rewards.id })
        .from(rewards)
        .where(and(eq(rewards.sourceType, "contribution"), eq(rewards.sourceId, id)))
        .limit(1);
      if (!prior) {
        await db.insert(rewards).values({
          userId: c.userId,
          kind: "incident",
          title: "Approved incident report",
          description: c.title,
          points: 10,
          sourceType: "contribution",
          sourceId: id,
          awardedBy: admin.name,
        });
      }
    }
  }
  revalidatePath("/admin");
  revalidatePath("/account");
}

export async function reviewInterpretation(fd: FormData) {
  const admin = await requireAdmin();
  const id = s(fd, "id");
  const verdict = s(fd, "verdict");
  if (!["accepted", "rejected"].includes(verdict)) return;
  await db.update(aiInterpretations).set({ reviewStatus: verdict, reviewerNote: s(fd, "note") || null }).where(eq(aiInterpretations.id, id));
  await db.insert(moderationRecords).values({ targetType: "ai_interpretation", targetId: id, action: `ai:${verdict}`, actor: admin.name });
  revalidatePath("/admin");
}

const SOURCE_BY_CATEGORY: Record<string, string[]> = {
  flooding: ["bmkg", "pemkot-bandar-lampung"],
  weather_env: ["bmkg"],
  services: ["pemkot-bandar-lampung", "bps"],
  mobility: ["pemkot-bandar-lampung"],
  public_space: ["pemkot-bandar-lampung"],
  accessibility: ["pemkot-bandar-lampung"],
  waste: ["pemkot-bandar-lampung"],
};

export async function generateInsight(fd: FormData) {
  const admin = await requireAdmin();
  const category = s(fd, "category") || null;
  const areaId = s(fd, "areaId") || null;
  const initiative = s(fd, "initiative") || null;
  const includeSynthetic = s(fd, "includeSynthetic") === "on";

  const rows = await db
    .select({ c: contributions, areaName: areas.name, ini: initiatives.slug })
    .from(contributions)
    .innerJoin(consentRecords, eq(consentRecords.contributionId, contributions.id))
    .leftJoin(areas, eq(areas.id, contributions.areaId))
    .leftJoin(initiatives, eq(initiatives.id, contributions.initiativeId))
    .where(
      and(
        eq(contributions.status, "approved"),
        eq(consentRecords.researchUse, true),
        category ? eq(contributions.category, category) : undefined,
        areaId ? eq(contributions.areaId, areaId) : undefined,
        includeSynthetic ? undefined : eq(contributions.isSynthetic, false)
      )
    )
    .limit(60);
  const items = rows.filter((r) => !initiative || r.ini === initiative);
  if (items.length < 2) redirect(`/admin?tab=insights&msg=${encodeURIComponent(`Only ${items.length} eligible record(s) match. At least 2 are needed to draft an insight.`)}`);

  const areaName = areaId ? items[0].areaName : null;
  const { draft, method, model } = await draftInsight(
    { category, areaName },
    items.map((r) => ({ id: r.c.id, title: r.c.title, body: r.c.body, emotion: r.c.emotion, category: r.c.category, areaName: r.areaName, isSynthetic: r.c.isSynthetic }))
  );
  const districts = new Set(items.map((r) => r.areaName).filter(Boolean)).size;
  const synth = items.filter((r) => r.c.isSynthetic).length;
  const withEmotion = items.filter((r) => r.c.emotion).length;
  const representationNote = `Based on ${items.length} self-selected contribution(s) from ${districts} district(s); ${withEmotion} include a self-reported feeling${synth ? `; ${synth} are synthetic demo records` : ""}. Residents without smartphones or time to participate, or who did not feel safe sharing, are likely under-represented. Report counts do not indicate prevalence.`;

  const [ini] = initiative ? await db.select().from(initiatives).where(eq(initiatives.slug, initiative)) : [undefined];
  const [ins] = await db
    .insert(insights)
    .values({
      initiativeId: ini?.id ?? null,
      areaId,
      category,
      title: draft.title,
      summary: draft.summary,
      themes: draft.themes,
      emotionDistribution: emotionDistribution(items.map((r) => r.c)),
      confidence: draft.confidence,
      uncertaintyNote: draft.uncertaintyNote,
      representationNote,
      method,
      model,
      promptVersion: PROMPT_VERSIONS.insight,
      status: "draft",
    })
    .returning({ id: insights.id });
  await db.insert(insightContributions).values(items.map((r) => ({ insightId: ins.id, contributionId: r.c.id })));

  const slugs = new Set<string>(["yousee-methodology", ...(category ? SOURCE_BY_CATEGORY[category] ?? [] : [])]);
  if (items.some((r) => !r.c.isSynthetic)) slugs.add("yousee-community");
  if (synth) slugs.add("yousee-synthetic");
  const srcs = await db.select({ id: evidenceSources.id }).from(evidenceSources).where(inArray(evidenceSources.slug, [...slugs]));
  if (srcs.length) await db.insert(insightSources).values(srcs.map((x) => ({ insightId: ins.id, sourceId: x.id })));
  await db.insert(moderationRecords).values({ targetType: "insight", targetId: ins.id, action: `insight:generated:${method}`, actor: admin.name });
  revalidatePath("/admin");
  redirect(`/admin?tab=insights&msg=${encodeURIComponent("Draft insight created. Review the text, then send it to community review.")}`);
}

export async function setInsightStatus(fd: FormData) {
  const admin = await requireAdmin();
  const id = s(fd, "id");
  const status = s(fd, "status");
  if (!["draft", "in_review", "published", "archived"].includes(status)) return;
  if (status === "published") {
    const v = await db.select({ id: validationRecords.id }).from(validationRecords).where(eq(validationRecords.insightId, id)).limit(1);
    if (!v.length) redirect(`/admin?tab=insights&msg=${encodeURIComponent("Cannot publish: an insight needs at least one community validation response first.")}`);
  }
  await db.update(insights).set({ status, publishedAt: status === "published" ? new Date() : null }).where(eq(insights.id, id));
  await db.insert(moderationRecords).values({ targetType: "insight", targetId: id, action: `insight:${status}`, note: s(fd, "note") || null, actor: admin.name });
  revalidatePath("/admin");
  revalidatePath("/understand");
}

export async function editInsight(fd: FormData) {
  const admin = await requireAdmin();
  const id = s(fd, "id");
  const title = s(fd, "title");
  const summary = s(fd, "summary");
  if (!title || !summary) return;
  const [cur] = await db.select({ method: insights.method }).from(insights).where(eq(insights.id, id));
  if (!cur) return;
  const method = cur.method.endsWith("+human-edited") ? cur.method : `${cur.method}+human-edited`;
  await db.update(insights).set({ title, summary, method }).where(eq(insights.id, id));
  await db.insert(moderationRecords).values({ targetType: "insight", targetId: id, action: "insight:edited", actor: admin.name });
  revalidatePath("/admin");
}

export async function moderateProposal(fd: FormData) {
  const admin = await requireAdmin();
  const id = s(fd, "id");
  const moderation = s(fd, "moderation");
  const status = s(fd, "status");
  const evidence = s(fd, "evidence");
  const patch: Partial<typeof proposals.$inferInsert> = {};
  if (["pending", "approved", "rejected"].includes(moderation)) patch.moderation = moderation;
  if (status) {
    const st = PROPOSAL_STATUSES.find((x) => x.id === status);
    if (!st) return;
    if (st.needsEvidence && !/^https?:\/\//.test(evidence)) {
      redirect(`/admin?tab=proposals&msg=${encodeURIComponent(`Status "${st.label}" requires a public evidence URL.`)}`);
    }
    patch.status = status;
    patch.statusEvidenceUrl = st.needsEvidence ? evidence : null;
  }
  await db.update(proposals).set(patch).where(eq(proposals.id, id));
  await db.insert(moderationRecords).values({ targetType: "proposal", targetId: id, action: `proposal:${moderation || ""}:${status || ""}`, note: evidence || null, actor: admin.name });
  revalidatePath("/admin");
  revalidatePath("/possibilities");
}
