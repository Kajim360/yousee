import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getInsightDetail } from "@/lib/queries";
import { ConfidenceTag, EmotionDot, LayerTag, Notice, StatusTag } from "@/components/ui";
import { categoryLabel, emotionMeta } from "@/lib/domain";
import { ValidationForm } from "./ValidationForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Insight" };

export default async function InsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const d = await getInsightDetail(id);
  if (!d || !["published", "in_review"].includes(d.insight.status)) notFound();
  const i = d.insight;
  const dist = i.emotionDistribution as Record<string, number>;
  const v = d.validations;
  const tally = { agree: v.filter((x) => x.verdict === "agree").length, partially: v.filter((x) => x.verdict === "partially").length, disagree: v.filter((x) => x.verdict === "disagree").length };
  const synthetic = d.records.filter((r) => r.isSynthetic).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/understand" className="text-sm underline">All insights</Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusTag status={i.status} />
        <ConfidenceTag level={i.confidence} />
        {synthetic > 0 && <LayerTag kind="synthetic">{synthetic} synthetic records</LayerTag>}
      </div>
      <h1 className="mt-3 text-3xl font-bold md:text-4xl">{i.title}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {d.areaName ?? "Citywide"} · {i.category ? categoryLabel(i.category) : "All topics"} · drafted {i.createdAt.toLocaleDateString()}
        {i.publishedAt ? ` · published ${i.publishedAt.toLocaleDateString()}` : ""}
      </p>
      {i.status === "in_review" && (
        <div className="mt-4">
          <Notice tone="butter">This insight is in <strong>community review</strong>. It is not yet a published finding. Your feedback below decides whether it is published, revised or withdrawn.</Notice>
        </div>
      )}

      <section className="card mt-6">
        <div className="flex items-center gap-2"><LayerTag kind="ai" /><span className="text-xs text-ink-soft">{i.method === "llm" ? `Model: ${i.model}` : "Keyword heuristic (no language model)"} · prompt {i.promptVersion}</span></div>
        <p className="mt-3 whitespace-pre-line leading-relaxed">{i.summary}</p>
        {(i.themes as string[]).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">{(i.themes as string[]).map((t) => <span key={t} className="chip bg-violet-50 text-violet-900">{t}</span>)}</div>
        )}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Notice tone="butter"><strong>Uncertainty:</strong> {i.uncertaintyNote}</Notice>
          <Notice tone="rose"><strong>Representation:</strong> {i.representationNote}</Notice>
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="card">
          <LayerTag kind="emotion" />
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(dist).map(([k, n]) => <li key={k}><EmotionDot id={k} /> {emotionMeta(k)?.label ?? "Not given"}: {n}</li>)}
          </ul>
        </div>
        <div className="card">
          <LayerTag kind="spatial" />
          <p className="mt-3 text-sm">{d.areaName ? `Scoped to ${d.areaName} (approximate district centroid).` : `Records from ${new Set(d.records.map((r) => r.areaName)).size} district(s).`}</p>
          <p className="mt-2 text-xs text-ink-soft">District assignment uses nearest approximate centroid, not official boundaries.</p>
        </div>
        <div className="card">
          <LayerTag kind="validation" />
          <p className="mt-3 text-sm">Agree {tally.agree} · Partially {tally.partially} · Disagree {tally.disagree}</p>
          <p className="mt-2 text-xs text-ink-soft">Publication requires moderator sign-off after community review.</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">Original records this insight draws on ({d.records.length})</h2>
        {d.withheld > 0 && <p className="mt-1 text-sm text-ink-soft">{d.withheld} further linked record(s) are withheld because they are not public or were deleted by the contributor.</p>}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {d.records.map((r, idx) => (
            <article key={r.id} className="card !p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold">R{idx + 1}</span>
                <LayerTag kind="citizen" />
                {r.isSynthetic && <LayerTag kind="synthetic" />}
                <span className="text-ink-soft">{r.areaName ?? "No location"}</span>
              </div>
              <p className="mt-2 font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{r.body}</p>
              {r.observation && <p className="mt-2 text-xs"><LayerTag kind="observation" /> {r.observation}</p>}
              {r.emotion && <p className="mt-2 text-xs"><EmotionDot id={r.emotion} /> Felt {emotionMeta(r.emotion)?.label.toLowerCase()}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-bold">External evidence & sources</h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {d.sources.map((s) => (
            <li key={s.id} className="card !p-4 text-sm">
              <LayerTag kind={s.sourceType === "synthetic" ? "synthetic" : "evidence"}>{s.sourceType}</LayerTag>
              <a href={s.url} className="mt-2 block font-semibold text-sky-deep underline" target={s.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{s.name}</a>
              <p className="mt-1 text-xs text-ink-soft">Limitations: {s.limitations}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-xl font-bold">Does this reflect your experience?</h2>
          <p className="mt-1 text-sm text-ink-soft">Residents, facilitators and researchers can review this insight. Comments are shown publicly after a basic check.</p>
          <ValidationForm insightId={i.id} />
        </div>
        <div>
          <h3 className="font-semibold">Review responses</h3>
          <ul className="mt-3 space-y-2">
            {v.map((x) => (
              <li key={x.id} className="card !p-3 text-sm">
                <span className="chip bg-ink/5">{x.reviewerRole}</span> <strong className="ml-1">{x.verdict}</strong>
                {x.comment && <p className="mt-1 text-ink-soft">{x.comment}</p>}
              </li>
            ))}
            {v.length === 0 && <li className="text-sm text-ink-soft">No responses yet.</li>}
          </ul>
          <Link href={`/possibilities?insight=${i.id}`} className="btn-rose mt-4">Propose a response based on this insight</Link>
        </div>
      </section>
    </div>
  );
}
