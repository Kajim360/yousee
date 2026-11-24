import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { askLogs, evidenceSources, insights, knowledgeDocs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { answerQuestion, PROMPT_VERSIONS, scoreChunks, type RetrievedChunk } from "@/lib/ai";
import { getPublicContributions } from "@/lib/queries";
import { ensureSeed } from "@/lib/seed";
import { categoryLabel } from "@/lib/domain";
import { redactPII } from "@/lib/privacy";

export const dynamic = "force-dynamic";

const schema = z.object({ question: z.string().trim().min(4).max(500) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please ask a question of 4–500 characters." }, { status: 400 });
  const question = redactPII(parsed.data.question);
  await ensureSeed();

  const [docs, contribs, pubInsights] = await Promise.all([
    db.select({ d: knowledgeDocs, s: evidenceSources }).from(knowledgeDocs).innerJoin(evidenceSources, eq(evidenceSources.id, knowledgeDocs.sourceId)),
    getPublicContributions(),
    db.select().from(insights).where(eq(insights.status, "published")),
  ]);

  type Cand = Omit<RetrievedChunk, "score" | "ref"> & { topic?: string; prefix: string };
  const candidates: Cand[] = [
    ...docs.map(({ d, s }) => ({ prefix: "D", kind: "document" as const, title: d.title, topic: d.topic, text: d.body, sourceName: s.name, sourceType: s.sourceType, url: s.url })),
    ...contribs.map((c) => ({
      prefix: "C",
      kind: "contribution" as const,
      title: c.title,
      topic: `${categoryLabel(c.category)} ${c.category} ${c.areaName ?? ""}`,
      text: `${c.isSynthetic ? "(SYNTHETIC DEMO RECORD — not real) " : ""}${c.areaName ? `In ${c.areaName}: ` : ""}${c.body}`,
      sourceName: c.isSynthetic ? "YouSee synthetic demo record" : "YouSee community contribution",
      sourceType: c.isSynthetic ? "synthetic" : "community",
      url: "/explore",
    })),
    ...pubInsights.map((i) => ({ prefix: "I", kind: "insight" as const, title: i.title, topic: i.category ?? "", text: `${i.summary} Confidence: ${i.confidence}. ${i.uncertaintyNote}`, sourceName: "YouSee published insight", sourceType: "insight", url: `/understand/${i.id}` })),
  ];

  const ranked = scoreChunks(question, candidates).filter((c) => c.score > 0);
  // Keep diversity: at most 4 contributions among the top results
  const picked: (Cand & { score: number })[] = [];
  let cCount = 0;
  for (const c of ranked) {
    if (picked.length >= 6) break;
    if (c.kind === "contribution") {
      if (cCount >= 4) continue;
      cCount++;
    }
    picked.push(c);
  }
  const counters: Record<string, number> = {};
  const chunks: RetrievedChunk[] = picked.map((c) => {
    counters[c.prefix] = (counters[c.prefix] ?? 0) + 1;
    return { ref: `${c.prefix}${counters[c.prefix]}`, kind: c.kind, title: c.title, text: c.text, sourceName: c.sourceName, sourceType: c.sourceType, url: c.url, score: Math.round(c.score * 100) / 100 };
  });

  const result = await answerQuestion(question, chunks);
  const [log] = await db
    .insert(askLogs)
    .values({
      question,
      answer: result.answer,
      sources: chunks.map(({ ref, title, sourceName, sourceType, url, score }) => ({ ref, title, sourceName, sourceType, url, score })),
      method: result.method,
      model: result.model,
      promptVersion: PROMPT_VERSIONS.ask,
      evidenceSufficient: result.sufficient,
    })
    .returning({ id: askLogs.id });

  return NextResponse.json({ id: log.id, answer: result.answer, method: result.method, model: result.model, sufficient: result.sufficient, sources: chunks });
}
