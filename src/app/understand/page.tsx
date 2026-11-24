import type { Metadata } from "next";
import { PHOTOS } from "@/lib/media";
import Link from "next/link";
import { getAreas, getInsightsList, getPublicContributions } from "@/lib/queries";
import { ConfidenceTag, EmptyState, LayerTag, Notice, PageHeader, StatusTag } from "@/components/ui";
import { CATEGORIES, EMOTIONS } from "@/lib/domain";
import { HBarChart } from "./Charts";
import { db } from "@/db";
import { contributions } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Understand" };

export default async function UnderstandPage({ searchParams }: { searchParams: Promise<{ real?: string }> }) {
  const sp = await searchParams;
  const realOnly = sp.real === "1";
  const [all, areas, ins] = await Promise.all([getPublicContributions(), getAreas(), getInsightsList()]);
  const items = realOnly ? all.filter((i) => !i.isSynthetic) : all;

  const catData = CATEGORIES.map((c) => ({ name: c.label, value: items.filter((i) => i.category === c.id).length, color: "#B9D7F2" })).filter((d) => d.value).sort((a, b) => b.value - a.value);
  const emoData = [
    ...EMOTIONS.map((e) => ({ name: e.label, value: items.filter((i) => i.emotion === e.id).length, color: e.color })),
    { name: "Not given", value: items.filter((i) => !i.emotion).length, color: "#FFFCF7" },
  ].filter((d) => d.value);
  const perArea = areas.map((a) => ({ name: a.name, value: items.filter((i) => i.areaId === a.id).length }));
  const gaps = perArea.filter((a) => a.value === 0);
  const shelensShare = items.length ? Math.round((items.filter((i) => i.initiative === "shelens").length / items.length) * 100) : 0;

  // Representation: aggregated only; suppressed below n=5 to avoid re-identification
  const [demo] = await db
    .select({
      total: sql<number>`count(*) filter (where status='approved' and not is_synthetic)::int`,
      withDemo: sql<number>`count(*) filter (where status='approved' and not is_synthetic and (age_range is not null or gender_identity is not null))::int`,
    })
    .from(contributions);

  return (
    <>
      <PageHeader eyebrow="03 · Understand" title="Collective insights, with their evidence attached" tone="butter" photo={PHOTOS["community-dialogue"]}>
        Patterns from approved contributions. Every number below counts <em>who chose to share</em>. It is not a measure of how common an issue is.
      </PageHeader>
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/understand" className={realOnly ? "btn-ghost" : "btn-primary"}>All records ({all.length})</Link>
          <Link href="/understand?real=1" className={realOnly ? "btn-primary" : "btn-ghost"}>Real contributions only ({all.filter((i) => !i.isSynthetic).length})</Link>
          {!realOnly && all.some((i) => i.isSynthetic) && <LayerTag kind="synthetic">Includes synthetic demo data</LayerTag>}
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <p className="eyebrow">Topics residents shared about</p>
            <HBarChart data={catData} />
          </div>
          <div className="card">
            <p className="eyebrow">Citizen-selected feelings</p>
            <HBarChart data={emoData} />
            <p className="mt-2 text-xs text-ink-soft">Self-reported and optional. Not interpreted or re-labelled.</p>
          </div>
        </section>

        <section className="card">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Representation & coverage</p>
              <h2 className="mt-1 text-2xl font-bold">Whose experiences might be missing?</h2>
            </div>
            <p className="text-sm text-ink-soft">SheLens share of records: <strong>{shelensShare}%</strong></p>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">Contributions per district</p>
              <HBarChart data={perArea.sort((a, b) => b.value - a.value).map((a) => ({ ...a, color: a.value ? "#F4B6C9" : "#eee" }))} height={480} />
            </div>
            <div className="space-y-3 text-sm">
              <Notice tone="butter">
                <strong>{gaps.length} of {areas.length} districts</strong> have no contributions{realOnly ? "" : " (including demo data)"}:{" "}
                {gaps.map((g) => g.name).join(", ") || "none"}. No reports means no one has shared yet. It does not mean there are no issues.
              </Notice>
              <Notice>
                Demographic details are optional and need separate consent. {demo.total < 5
                  ? `Fewer than 5 real contributions so far, so representation figures are suppressed to protect privacy.`
                  : `${demo.withDemo} of ${demo.total} real contributions include optional demographic details. Breakdowns are reported only for groups of 5 or more.`}
              </Notice>
              <Notice tone="rose">
                Known participation barriers: smartphone and data access, digital literacy, time, language, and whether people feel safe
                sharing. Facilitated offline sessions are planned (see the roadmap) to reach under-represented residents.
              </Notice>
            </div>
          </div>
        </section>

        <section>
          <p className="eyebrow">Insights</p>
          <h2 className="mt-1 text-2xl font-bold">Reviewed and in-review insights</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {ins.map((i) => (
              <Link key={i.id} href={`/understand/${i.id}`} className="card hover:border-ink/30">
                <div className="flex flex-wrap gap-2">
                  <StatusTag status={i.status} />
                  <ConfidenceTag level={i.confidence} />
                  <span className="chip bg-ink/5">{i.method === "llm" ? "AI-drafted" : "Heuristic draft"}</span>
                </div>
                <p className="mt-3 font-display text-lg font-bold">{i.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{i.summary}</p>
                <p className="mt-3 text-xs text-ink-soft">{i.recordCount} linked records · {i.validationCount} validation responses · {i.areaName ?? "Citywide"}</p>
              </Link>
            ))}
          </div>
          {ins.length === 0 && (
            <EmptyState title="No insights yet">
              Moderators draft insights from approved contributions in the moderation area. Drafts go to community review before publication.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
