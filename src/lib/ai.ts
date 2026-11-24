import "server-only";
import { z } from "zod";
import { CATEGORIES, ANALYTICAL_FRAMES, categoryLabel, emotionMeta } from "./domain";
import { redactPII } from "./privacy";

export const PROMPT_VERSIONS = {
  categorize: "categorize-v1",
  insight: "insight-v1",
  ask: "ask-v1",
} as const;

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
export function aiModel() {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
}

async function callClaude(system: string, user: string, maxTokens = 900): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: aiModel(),
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.error("Claude API error", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return data.content?.find((c) => c.type === "text")?.text ?? null;
  } catch (e) {
    console.error("Claude API failure", e);
    return null;
  }
}

function extractJson(text: string): unknown {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

const STOP = new Set(
  "the a an and or of to in on at for is are was were be it this that with my our i we you they there here from as by not no yes do does did what why how where when which who can could would should about into have has had near after before very more most di ke dan yang ini itu untuk dengan dari pada ada tidak saya kami apa mengapa bagaimana dimana".split(
    " "
  )
);
export function tokenize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u024F\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

// ───────────────────────── Categorisation & exploratory frame ─────────────────────────

const KEYWORDS: Record<string, string[]> = {
  flooding: ["flood", "banjir", "drain", "drainage", "water", "genangan", "rain", "hujan", "tide", "overflow", "selokan"],
  mobility: ["angkot", "bus", "transport", "road", "traffic", "route", "crossing", "commute", "jalan", "motor"],
  public_space: ["park", "taman", "field", "square", "plaza", "public space", "playground", "bench"],
  accessibility: ["wheelchair", "stroller", "kerb", "curb", "ramp", "footpath", "trotoar", "stairs", "disab"],
  safety_comfort: ["dark", "light", "unsafe", "harass", "afraid", "fear", "uncomfortable", "lamp", "gelap"],
  weather_env: ["heat", "hot", "panas", "shade", "tree", "air", "pollution", "smoke", "dust"],
  services: ["school", "puskesmas", "clinic", "hospital", "health", "education", "office", "queue", "sekolah"],
  waste: ["rubbish", "trash", "garbage", "sampah", "waste", "plastic", "smell"],
  place_identity: ["memory", "heritage", "history", "home", "identity", "old town", "grew up", "kenangan"],
};

const categorizationSchema = z.object({
  suggestedCategory: z.enum(CATEGORIES.map((c) => c.id) as [string, ...string[]]),
  themes: z.array(z.string()).max(6),
  suggestedFrame: z.enum(ANALYTICAL_FRAMES.map((f) => f.id) as [string, ...string[]]),
  frameRationale: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  caveat: z.string(),
});
export type Categorization = z.infer<typeof categorizationSchema>;

export async function categorizeContribution(c: {
  title: string;
  body: string;
  category: string;
  emotion: string | null;
  emotionNote: string | null;
  cognitiveType: string | null;
}): Promise<{ output: Categorization; method: "llm" | "heuristic"; model: string | null }> {
  const text = redactPII(`${c.title}\n${c.body}\n${c.emotionNote ?? ""}`);
  const system = `You assist urban researchers in Bandar Lampung, Indonesia. You SUGGEST (never decide) a category and an exploratory interpretive frame for a resident's contribution.
Rules:
- The frame (open, fight, flight, freeze, fawn, unknown) is an exploratory research lens about the person's relationship with a PLACE. It is NOT a diagnosis or psychological assessment.
- Do not equate the resident's selected emotion with a frame. Use "unknown" when the text does not clearly support a frame.
- Do not infer personal characteristics (gender, ethnicity, religion, health).
- Themes must be short phrases grounded in the text.
Return ONLY JSON: {"suggestedCategory": one of ${CATEGORIES.map((x) => x.id).join("|")}, "themes": string[], "suggestedFrame": open|fight|flight|freeze|fawn|unknown, "frameRationale": string, "confidence": low|medium|high, "caveat": string}`;
  const user = `Resident-selected category: ${c.category}\nResident-selected emotion (optional): ${c.emotion ?? "not given"}\nCognitive map type: ${c.cognitiveType ?? "n/a"}\nText:\n"""${text}"""`;
  const raw = await callClaude(system, user, 500);
  if (raw) {
    const parsed = categorizationSchema.safeParse(extractJson(raw));
    if (parsed.success) return { output: parsed.data, method: "llm", model: aiModel() };
  }
  return { output: heuristicCategorize(c), method: "heuristic", model: null };
}

function heuristicCategorize(c: { title: string; body: string; category: string; cognitiveType: string | null }): Categorization {
  const t = `${c.title} ${c.body}`.toLowerCase();
  let best = c.category;
  let bestScore = 0;
  const themes: string[] = [];
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    const hits = words.filter((w) => t.includes(w));
    if (hits.length) themes.push(...hits.slice(0, 2));
    if (hits.length > bestScore) {
      bestScore = hits.length;
      best = cat;
    }
  }
  let frame = "unknown";
  let rationale = "Keyword heuristics cannot reliably infer a relationship with place; left as 'unknown' for human review.";
  if (c.cognitiveType === "avoid" || /avoid|longer route|bypass|menghindar/.test(t)) {
    frame = "flight";
    rationale = "Text mentions avoiding or bypassing the place (keyword heuristic).";
  } else if (/carry|move belongings|adapt|cope|every rainy season|terpaksa/.test(t)) {
    frame = "fawn";
    rationale = "Text describes adapting routines to cope with the place (keyword heuristic).";
  } else if (/calm|pleasant|gather|home|family|nyaman/.test(t)) {
    frame = "open";
    rationale = "Text describes comfortable, receptive engagement (keyword heuristic).";
  }
  return {
    suggestedCategory: best,
    themes: Array.from(new Set(themes)).slice(0, 6),
    suggestedFrame: frame,
    frameRationale: rationale,
    confidence: "low",
    caveat: "Heuristic suggestion (no language model configured). Requires human review; not a validated classification.",
  };
}

// ───────────────────────── Insight generation ─────────────────────────

type InsightInput = {
  id: string;
  title: string;
  body: string;
  emotion: string | null;
  category: string;
  areaName: string | null;
  isSynthetic: boolean;
};

const insightSchema = z.object({
  title: z.string().max(140),
  summary: z.string(),
  themes: z.array(z.string()).max(8),
  confidence: z.enum(["low", "medium", "high"]),
  uncertaintyNote: z.string(),
});
export type InsightDraft = z.infer<typeof insightSchema>;

export function emotionDistribution(items: { emotion: string | null }[]) {
  const d: Record<string, number> = {};
  for (const i of items) d[i.emotion ?? "not_given"] = (d[i.emotion ?? "not_given"] ?? 0) + 1;
  return d;
}

export function topThemes(items: { title: string; body: string }[], n = 6) {
  const counts = new Map<string, number>();
  for (const i of items) {
    for (const w of new Set(tokenize(`${i.title} ${i.body}`.replace(/synthetic demo/gi, "")))) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

export async function draftInsight(
  scope: { category: string | null; areaName: string | null },
  items: InsightInput[]
): Promise<{ draft: InsightDraft; method: "llm" | "heuristic"; model: string | null }> {
  const n = items.length;
  const synth = items.filter((i) => i.isSynthetic).length;
  const records = items
    .map((i, idx) => `[R${idx + 1}] area=${i.areaName ?? "unknown"}; emotion=${i.emotion ?? "not given"}; "${redactPII(i.title)} — ${redactPII(i.body)}"`)
    .join("\n");
  const system = `You help community researchers summarise resident contributions about Bandar Lampung, Indonesia.
Rules:
- Summarise ONLY what the records say. Cite records like [R1], [R2].
- Do not explain causes unless residents state them; never claim causation.
- Many reports in a place do not mean the problem is most prevalent there. Note reporting bias.
- Preserve disagreement and minority perspectives.
- Do not label any area or community as unsafe; describe what residents reported.
- No personal data. Plain language.
- If records are synthetic demo data, say so in uncertaintyNote.
- With fewer than 5 records confidence must be "low".
Return ONLY JSON: {"title": string, "summary": string, "themes": string[], "confidence": "low"|"medium"|"high", "uncertaintyNote": string}`;
  const user = `Scope: category=${scope.category ? categoryLabel(scope.category) : "all"}; area=${scope.areaName ?? "whole city"}. ${n} records (${synth} synthetic).\n${records}`;
  const raw = await callClaude(system, user, 900);
  if (raw) {
    const parsed = insightSchema.safeParse(extractJson(raw));
    if (parsed.success) {
      const d = parsed.data;
      if (n < 5) d.confidence = "low";
      return { draft: d, method: "llm", model: aiModel() };
    }
  }
  // Transparent extractive fallback
  const dist = emotionDistribution(items);
  const distText = Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${emotionMeta(k)?.label ?? "not given"}: ${v}`)
    .join(", ");
  const areasList = Array.from(new Set(items.map((i) => i.areaName).filter(Boolean)));
  const themes = topThemes(items);
  const quotes = items
    .slice(0, 3)
    .map((i, idx) => `[R${idx + 1}] "${i.title}"`)
    .join("; ");
  return {
    draft: {
      title: `${scope.category ? categoryLabel(scope.category) : "Contributions"}${scope.areaName ? ` in ${scope.areaName}` : " across Bandar Lampung"}: ${n} shared experience${n === 1 ? "" : "s"}`,
      summary: `${n} approved contribution${n === 1 ? "" : "s"} ${scope.areaName ? `from ${scope.areaName}` : `across ${areasList.length} district(s) (${areasList.slice(0, 5).join(", ")}${areasList.length > 5 ? ", …" : ""})`} relate to ${scope.category ? categoryLabel(scope.category).toLowerCase() : "several topics"}. Frequently recurring words: ${themes.join(", ") || "none recurring"}. Self-reported feelings — ${distText}. Example contributions: ${quotes}. This is an extractive summary; it does not explain causes.`,
      themes,
      confidence: "low",
      uncertaintyNote: `Generated by a keyword-count heuristic, not a language model. ${synth ? `${synth} of ${n} records are SYNTHETIC demo data — this insight is illustrative only. ` : ""}Small, self-selected sample; requires community validation.`,
    },
    method: "heuristic",
    model: null,
  };
}

// ───────────────────────── Ask Your City (RAG) ─────────────────────────

export type RetrievedChunk = {
  ref: string;
  kind: "document" | "contribution" | "insight";
  title: string;
  text: string;
  sourceName: string;
  sourceType: string;
  url: string;
  score: number;
};

export function scoreChunks<T extends { title: string; text: string; topic?: string }>(question: string, chunks: T[]) {
  const q = tokenize(question);
  return chunks
    .map((c) => {
      const hay = tokenize(`${c.title} ${c.topic ?? ""} ${c.text}`);
      const set = new Set(hay);
      const titleSet = new Set(tokenize(`${c.title} ${c.topic ?? ""}`));
      let s = 0;
      for (const w of q) {
        if (set.has(w)) s += 1;
        else if (hay.some((h) => h.startsWith(w.slice(0, 5)) && w.length >= 5)) s += 0.5;
        if (titleSet.has(w)) s += 0.5;
      }
      return { ...c, score: q.length ? s / Math.sqrt(q.length) : 0 };
    })
    .sort((a, b) => b.score - a.score);
}

export async function answerQuestion(question: string, chunks: RetrievedChunk[]) {
  const sufficient = chunks.length > 0 && chunks[0].score >= 0.7;
  const context = chunks
    .map((c) => `[${c.ref}] (${c.sourceType}: ${c.sourceName}) ${c.title}: ${c.text}`)
    .join("\n\n");
  const system = `You are "Ask Your City", YouSee's civic assistant for Bandar Lampung, Indonesia.
Rules:
- Answer ONLY from the provided evidence. Cite every claim with its reference, e.g. [D1] or [C2].
- [C*] items are resident contributions: describe them as "residents reported", never as verified facts.
- If the evidence does not answer the question, say clearly that YouSee does not have enough evidence, and point to the most relevant official source among the evidence.
- Never invent causes, statistics, eligibility, deadlines, phone numbers or policies.
- Do not label areas or communities as unsafe.
- Reply in the same language as the question. Plain, friendly language, at most ~180 words.`;
  const raw = sufficient || chunks.length ? await callClaude(system, `Evidence:\n${context || "(none)"}\n\nQuestion: ${question}`, 700) : null;
  if (raw) return { answer: raw.trim(), method: "llm" as const, model: aiModel(), sufficient };

  if (!sufficient) {
    return {
      answer:
        "YouSee does not have enough evidence to answer this question reliably. " +
        (chunks[0] ? `The closest related information is "${chunks[0].title}" [${chunks[0].ref}]. ` : "") +
        "For official information, check BMKG (weather), BPS (statistics), the Kota Bandar Lampung portal (planning and services) or LAPOR! (official complaints).",
      method: "retrieval-only" as const,
      model: null,
      sufficient,
    };
  }
  const top = chunks.slice(0, 3);
  return {
    answer:
      "Here is what YouSee's evidence base contains (no language model configured, so passages are shown directly):\n\n" +
      top
        .map((c) => `• [${c.ref}] ${c.kind === "contribution" ? "A resident reported: " : ""}${c.text.length > 320 ? c.text.slice(0, 320) + "…" : c.text}`)
        .join("\n\n"),
    method: "retrieval-only" as const,
    model: null,
    sufficient,
  };
}
