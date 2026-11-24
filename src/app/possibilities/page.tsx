import type { Metadata } from "next";
import { PHOTOS } from "@/lib/media";
import Link from "next/link";
import { getAreas, getProposals } from "@/lib/queries";
import { db } from "@/db";
import { insights } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CategoryBadge, EmptyState, LayerTag, Notice, PageHeader } from "@/components/ui";
import { PROPOSAL_STATUSES, categoryLabel } from "@/lib/domain";
import { ProposalForm, SupportButton } from "./ProposalClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create Possibilities" };

export default async function PossibilitiesPage({ searchParams }: { searchParams: Promise<{ insight?: string }> }) {
  const sp = await searchParams;
  const [list, areas] = await Promise.all([getProposals(), getAreas()]);
  let linked: { id: string; title: string } | undefined;
  if (sp.insight && /^[0-9a-f-]{36}$/.test(sp.insight)) {
    const [i] = await db.select({ id: insights.id, title: insights.title }).from(insights).where(eq(insights.id, sp.insight));
    linked = i;
  }
  return (
    <>
      <PageHeader eyebrow="05 · Create Possibilities" title="From understanding to possible responses" tone="rose" photo={PHOTOS["community-tree-planting"]}>
        Community proposals based on shared experiences and insights. A status only moves beyond “Proposed” when a moderator attaches
        public evidence, such as an official statement or budget document.
      </PageHeader>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            {PROPOSAL_STATUSES.map((s) => (
              <span key={s.id} className={`chip ${s.tone}`}>{s.label}{s.needsEvidence ? " · evidence required" : ""}</span>
            ))}
          </div>
          {list.map(({ p, areaName, insightTitle }) => {
            const st = PROPOSAL_STATUSES.find((s) => s.id === p.status)!;
            return (
              <article key={p.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${st.tone}`}>{st.label}</span>
                  {p.isSynthetic && <LayerTag kind="synthetic" />}
                  <CategoryBadge id={p.category} label={categoryLabel(p.category)} />
                  <span className="text-xs text-ink-soft">{areaName ?? "Citywide"}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold">{p.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{p.description}</p>
                {insightTitle && p.insightId && <p className="mt-2 text-xs">Based on insight: <Link className="underline" href={`/understand/${p.insightId}`}>{insightTitle}</Link></p>}
                {p.statusEvidenceUrl && <p className="mt-2 text-xs">Status evidence: <a className="underline" href={p.statusEvidenceUrl} target="_blank" rel="noreferrer">{p.statusEvidenceUrl}</a></p>}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-ink-soft">{p.authorPseudonym ? `by ${p.authorPseudonym}` : "anonymous"}</span>
                  <SupportButton id={p.id} count={p.supportCount} />
                </div>
              </article>
            );
          })}
          {list.length === 0 && <EmptyState title="No proposals yet">Start from an insight on the Understand page, or propose an idea here.</EmptyState>}
        </section>
        <aside className="space-y-4">
          <div className="card">
            <h2 className="text-xl font-bold">Propose a response</h2>
            <p className="mb-4 mt-1 text-sm text-ink-soft">Proposals are reviewed for respectful language and personal data before appearing.</p>
            <ProposalForm areas={areas.map((a) => ({ id: a.id, name: a.name }))} insightId={linked?.id} insightTitle={linked?.title} />
          </div>
          <Notice tone="butter">YouSee is not connected to city decision-making. Support counts show community interest. They are not votes and are not representative samples.</Notice>
        </aside>
      </div>
    </>
  );
}
