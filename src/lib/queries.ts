import "server-only";
import { db } from "@/db";
import {
  areas,
  cities,
  contributions,
  initiatives,
  insights,
  insightContributions,
  insightSources,
  evidenceSources,
  validationRecords,
  proposals,
  opportunities,
  consentRecords,
  contentPosts,
  activities,
  rewards,
  users,
  proposals as proposalsTable,
} from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ensureSeed } from "./seed";

export type PublicContribution = {
  id: string;
  initiative: string | null;
  kind: string;
  category: string;
  title: string;
  body: string;
  emotion: string | null;
  cognitiveType: string | null;
  observation: string | null;
  locationPrecision: string;
  lat: number | null;
  lng: number | null;
  areaName: string | null;
  areaId: string | null;
  pseudonym: string | null;
  isSynthetic: boolean;
  hasMedia: boolean;
  createdAt: string;
};

export async function getCity() {
  await ensureSeed();
  const [city] = await db.select().from(cities).where(eq(cities.slug, "bandar-lampung"));
  return city;
}

export async function getAreas() {
  await ensureSeed();
  return db.select().from(areas).orderBy(areas.name);
}

export async function getInitiatives() {
  await ensureSeed();
  return db.select().from(initiatives).where(eq(initiatives.active, true));
}

/** Public contributions: approved + public-consented only. Raw geometry never selected. */
export async function getPublicContributions(opts: { initiative?: string; limit?: number } = {}): Promise<PublicContribution[]> {
  await ensureSeed();
  const rows = await db
    .select({
      id: contributions.id,
      initiative: initiatives.slug,
      kind: contributions.kind,
      category: contributions.category,
      title: contributions.title,
      body: contributions.body,
      emotion: contributions.emotion,
      cognitiveType: contributions.cognitiveType,
      observation: contributions.observation,
      locationPrecision: contributions.locationPrecision,
      lat: contributions.publicLat,
      lng: contributions.publicLng,
      areaName: areas.name,
      areaId: contributions.areaId,
      pseudonym: contributions.pseudonym,
      isSynthetic: contributions.isSynthetic,
      hasMedia: sql<boolean>`exists(select 1 from contribution_media m where m.contribution_id = ${contributions.id})`,
      createdAt: contributions.createdAt,
    })
    .from(contributions)
    .leftJoin(initiatives, eq(initiatives.id, contributions.initiativeId))
    .leftJoin(areas, eq(areas.id, contributions.areaId))
    .where(
      and(
        eq(contributions.status, "approved"),
        eq(contributions.privacyClass, "public"),
        opts.initiative ? eq(initiatives.slug, opts.initiative) : undefined
      )
    )
    .orderBy(desc(contributions.createdAt))
    .limit(opts.limit ?? 1000);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function getStats() {
  await ensureSeed();
  const [row] = await db
    .select({
      approved: sql<number>`count(*) filter (where status = 'approved')::int`,
      real: sql<number>`count(*) filter (where status = 'approved' and not is_synthetic)::int`,
      synthetic: sql<number>`count(*) filter (where status = 'approved' and is_synthetic)::int`,
      pending: sql<number>`count(*) filter (where status in ('pending','flagged'))::int`,
      districts: sql<number>`count(distinct area_id) filter (where status = 'approved')::int`,
    })
    .from(contributions);
  const [ins] = await db
    .select({ published: sql<number>`count(*) filter (where status = 'published')::int`, review: sql<number>`count(*) filter (where status = 'in_review')::int` })
    .from(insights);
  return { ...row, ...ins };
}

export async function getInsightsList(statuses: string[] = ["published", "in_review"]) {
  await ensureSeed();
  return db
    .select({
      id: insights.id,
      title: insights.title,
      summary: insights.summary,
      status: insights.status,
      confidence: insights.confidence,
      category: insights.category,
      areaName: areas.name,
      method: insights.method,
      createdAt: insights.createdAt,
      recordCount: sql<number>`(select count(*)::int from insight_contributions ic where ic.insight_id = ${insights.id})`,
      validationCount: sql<number>`(select count(*)::int from validation_records v where v.insight_id = ${insights.id})`,
    })
    .from(insights)
    .leftJoin(areas, eq(areas.id, insights.areaId))
    .where(inArray(insights.status, statuses))
    .orderBy(desc(insights.createdAt));
}

export async function getInsightDetail(id: string) {
  await ensureSeed();
  const [ins] = await db
    .select({ insight: insights, areaName: areas.name })
    .from(insights)
    .leftJoin(areas, eq(areas.id, insights.areaId))
    .where(eq(insights.id, id));
  if (!ins) return null;
  const linked = await db
    .select({ id: insightContributions.contributionId })
    .from(insightContributions)
    .where(eq(insightContributions.insightId, id));
  const ids = linked.map((l) => l.id);
  const records = ids.length
    ? (await getPublicContributions()).filter((c) => ids.includes(c.id))
    : [];
  const withheld = ids.length - records.length;
  const sources = await db
    .select({ s: evidenceSources })
    .from(insightSources)
    .innerJoin(evidenceSources, eq(evidenceSources.id, insightSources.sourceId))
    .where(eq(insightSources.insightId, id));
  const validations = await db
    .select()
    .from(validationRecords)
    .where(eq(validationRecords.insightId, id))
    .orderBy(desc(validationRecords.createdAt));
  return { ...ins, records, withheld, sources: sources.map((s) => s.s), validations };
}

export async function getSources() {
  await ensureSeed();
  return db.select().from(evidenceSources).orderBy(evidenceSources.sourceType, evidenceSources.name);
}

export async function getProposals() {
  await ensureSeed();
  return db
    .select({ p: proposals, areaName: areas.name, insightTitle: insights.title })
    .from(proposals)
    .leftJoin(areas, eq(areas.id, proposals.areaId))
    .leftJoin(insights, eq(insights.id, proposals.insightId))
    .where(eq(proposals.moderation, "approved"))
    .orderBy(desc(proposals.supportCount), desc(proposals.createdAt));
}

export async function getOpportunities() {
  await ensureSeed();
  return db.select().from(opportunities).orderBy(opportunities.kind);
}

// ───────────────── Accounts, recognition and editorial content ─────────────────

export async function getPublishedPosts(kind?: string) {
  await ensureSeed();
  return db
    .select()
    .from(contentPosts)
    .where(kind ? and(eq(contentPosts.status, "published"), eq(contentPosts.kind, kind)) : eq(contentPosts.status, "published"))
    .orderBy(desc(contentPosts.pinned), desc(contentPosts.publishedAt));
}

export async function getPost(id: string) {
  const [p] = await db.select().from(contentPosts).where(eq(contentPosts.id, id)).limit(1);
  return p ?? null;
}

export type LeaderRow = {
  userId: string;
  displayName: string;
  points: number;
  kudos: number;
  reports: number;
  activities: number;
};

export async function getLeaderboard(): Promise<LeaderRow[]> {
  await ensureSeed();
  const rows = await db
    .select({
      userId: users.id,
      displayName: users.displayName,
      points: sql<number>`coalesce(sum(${rewards.points}),0)::int`,
      kudos: sql<number>`coalesce(sum(${rewards.points}) filter (where ${rewards.kind} = 'kudos'),0)::int`,
    })
    .from(users)
    .leftJoin(rewards, eq(rewards.userId, users.id))
    .where(and(eq(users.publicProfile, true), eq(users.role, "participant")))
    .groupBy(users.id, users.displayName)
    .orderBy(desc(sql`coalesce(sum(${rewards.points}),0)`));
  const reportCounts = await db
    .select({ userId: contributions.userId, n: sql<number>`count(*)::int` })
    .from(contributions)
    .where(eq(contributions.status, "approved"))
    .groupBy(contributions.userId);
  const activityCounts = await db
    .select({ userId: activities.userId, n: sql<number>`count(*)::int` })
    .from(activities)
    .where(eq(activities.status, "approved"))
    .groupBy(activities.userId);
  const rMap = new Map(reportCounts.map((r) => [r.userId, r.n]));
  const aMap = new Map(activityCounts.map((r) => [r.userId, r.n]));
  return rows.map((r) => ({ ...r, reports: rMap.get(r.userId) ?? 0, activities: aMap.get(r.userId) ?? 0 }));
}

export async function getAccountData(userId: string) {
  await ensureSeed();
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const myRewards = await db.select().from(rewards).where(eq(rewards.userId, userId)).orderBy(desc(rewards.createdAt));
  const myActivities = await db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt));
  const myReports = await db
    .select({ id: contributions.id, title: contributions.title, status: contributions.status, createdAt: contributions.createdAt })
    .from(contributions)
    .where(eq(contributions.userId, userId))
    .orderBy(desc(contributions.createdAt));
  const myProposals = await db
    .select({ id: proposalsTable.id, title: proposalsTable.title, status: proposalsTable.status })
    .from(proposalsTable)
    .where(eq(proposalsTable.userId, userId))
    .orderBy(desc(proposalsTable.createdAt));
  const rank = (await getLeaderboard()).findIndex((r) => r.userId === userId);
  return {
    user: u ?? null,
    rewards: myRewards,
    activities: myActivities,
    reports: myReports,
    proposals: myProposals,
    points: myRewards.reduce((s, r) => s + r.points, 0),
    kudos: myRewards.filter((r) => r.kind === "kudos").length,
    rank: rank >= 0 ? rank + 1 : null,
  };
}

export async function getPendingActivities() {
  return db
    .select({ a: activities, displayName: users.displayName })
    .from(activities)
    .innerJoin(users, eq(users.id, activities.userId))
    .where(eq(activities.status, "pending"))
    .orderBy(desc(activities.createdAt));
}

export async function getConsentFor(contributionId: string) {
  const [c] = await db.select().from(consentRecords).where(eq(consentRecords.contributionId, contributionId));
  return c ?? null;
}
