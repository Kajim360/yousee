import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contributions, consentRecords, contributionMedia, initiatives, aiInterpretations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAreas, getCity, getPublicContributions } from "@/lib/queries";
import { nearestArea, newDeleteToken, publicCoordinate, redactPII } from "@/lib/privacy";
import { CATEGORIES, COGNITIVE_TYPES, CONSENT_VERSION, EMOTIONS, AGE_RANGES } from "@/lib/domain";
import { categorizeContribution, PROMPT_VERSIONS } from "@/lib/ai";
import { getCurrentUser } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

const coord = z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]); // [lat, lng]

const schema = z.object({
  initiative: z.enum(["yousee", "shelens"]),
  kind: z.enum(["issue", "experience", "cognitive"]),
  category: z.enum(CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(10).max(3000),
  emotion: z.enum(EMOTIONS.map((e) => e.id) as [string, ...string[]]).nullable().optional(),
  emotionNote: z.string().trim().max(500).nullable().optional(),
  cognitiveType: z.enum(COGNITIVE_TYPES.map((c) => c.id) as [string, ...string[]]).nullable().optional(),
  observation: z.string().trim().max(1000).nullable().optional(),
  geometryType: z.enum(["point", "route", "area", "none"]),
  vertices: z.array(coord).max(200).default([]),
  areaId: z.string().uuid().nullable().optional(),
  locationPrecision: z.enum(["exact", "approximate", "area_only", "none"]),
  participationMode: z.enum(["anonymous", "pseudonymous"]),
  pseudonym: z.string().trim().max(40).nullable().optional(),
  ageRange: z.enum(AGE_RANGES).nullable().optional(),
  genderIdentity: z.string().trim().max(40).nullable().optional(),
  consent: z.object({ publicDisplay: z.boolean(), researchUse: z.boolean(), demographicUse: z.boolean(), understood: z.literal(true) }),
  image: z
    .object({ mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]), dataBase64: z.string().max(2_000_000) })
    .nullable()
    .optional(),
  website: z.string().max(0).optional(), // honeypot
});

const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 10;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const initiative = url.searchParams.get("initiative") ?? undefined;
  const items = await getPublicContributions({ initiative });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(ip)) return NextResponse.json({ error: "Too many submissions. Please try again in a few minutes." }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form.", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }
  const d = parsed.data;
  const [city, areaList, user] = await Promise.all([getCity(), getAreas(), getCurrentUser()]);
  const [ini] = await db.select().from(initiatives).where(eq(initiatives.slug, d.initiative));

  // Geometry becomes GeoJSON (stored restricted) and representative point
  let geometry: object | null = null;
  let rep: [number, number] | null = null;
  const v = d.vertices;
  if (d.locationPrecision !== "none" && d.geometryType !== "none" && v.length) {
    if (d.geometryType === "point") {
      geometry = { type: "Point", coordinates: [v[0][1], v[0][0]] };
      rep = v[0];
    } else if (d.geometryType === "route" && v.length >= 2) {
      geometry = { type: "LineString", coordinates: v.map(([a, b]) => [b, a]) };
      rep = v[Math.floor(v.length / 2)];
    } else if (d.geometryType === "area" && v.length >= 3) {
      const ring = [...v, v[0]].map(([a, b]) => [b, a]);
      geometry = { type: "Polygon", coordinates: [ring] };
      rep = [v.reduce((s, p) => s + p[0], 0) / v.length, v.reduce((s, p) => s + p[1], 0) / v.length];
    }
  }
  let area = d.areaId ? areaList.find((a) => a.id === d.areaId) ?? null : null;
  if (!area && rep) area = nearestArea(rep[0], rep[1], areaList);

  // SheLens safeguard: "unsafe" experiences are never shown at near-exact precision.
  let precision = d.locationPrecision;
  if (precision === "exact" && d.initiative === "shelens" && d.emotion === "unsafe") precision = "approximate";
  if (!rep && precision !== "none" && precision !== "area_only") precision = area ? "area_only" : "none";
  const pub = publicCoordinate(precision, rep?.[0] ?? null, rep?.[1] ?? null, area);

  const demographicAllowed = d.consent.demographicUse;
  const containsPII = redactPII(`${d.title} ${d.body} ${d.emotionNote ?? ""}`) !== `${d.title} ${d.body} ${d.emotionNote ?? ""}`;
  const { token, hash } = newDeleteToken();

  const [row] = await db
    .insert(contributions)
    .values({
      initiativeId: ini?.id ?? null,
      userId: user?.id ?? null,
      cityId: city.id,
      areaId: area?.id ?? null,
      kind: d.kind,
      category: d.category,
      title: d.title,
      body: d.body,
      emotion: d.emotion ?? null,
      emotionNote: d.emotionNote || null,
      cognitiveType: d.kind === "cognitive" ? d.cognitiveType ?? null : null,
      observation: d.observation || null,
      geometryType: geometry ? d.geometryType : "none",
      geometry,
      locationPrecision: precision,
      publicLat: pub?.lat ?? null,
      publicLng: pub?.lng ?? null,
      participationMode: d.participationMode,
      pseudonym: d.participationMode === "pseudonymous" ? d.pseudonym || null : null,
      ageRange: demographicAllowed ? d.ageRange ?? null : null,
      genderIdentity: demographicAllowed ? d.genderIdentity || null : null,
      privacyClass: d.consent.publicDisplay ? "public" : "restricted",
      status: containsPII ? "flagged" : "pending",
      deleteTokenHash: hash,
    })
    .returning({ id: contributions.id });

  await db.insert(consentRecords).values({
    contributionId: row.id,
    consentVersion: CONSENT_VERSION,
    publicDisplay: d.consent.publicDisplay,
    researchUse: d.consent.researchUse,
    demographicUse: d.consent.demographicUse,
  });

  if (d.image) {
    await db.insert(contributionMedia).values({ contributionId: row.id, mimeType: d.image.mimeType, dataBase64: d.image.dataBase64 });
  }

  // AI suggestion stored separately (never overwrites the citizen's own choices)
  try {
    const r = await categorizeContribution({
      title: d.title,
      body: d.body,
      category: d.category,
      emotion: d.emotion ?? null,
      emotionNote: d.emotionNote ?? null,
      cognitiveType: d.cognitiveType ?? null,
    });
    await db.insert(aiInterpretations).values({
      contributionId: row.id,
      kind: "categorization",
      output: r.output,
      method: r.method,
      model: r.model,
      promptVersion: PROMPT_VERSIONS.categorize,
    });
  } catch (e) {
    console.error("categorization failed", e);
  }

  return NextResponse.json({
    id: row.id,
    deleteToken: token,
    status: containsPII ? "flagged" : "pending",
    locationPrecision: precision,
    areaName: area?.name ?? null,
    precisionAdjusted: precision !== d.locationPrecision,
  });
}
