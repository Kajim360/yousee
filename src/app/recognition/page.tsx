import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboard } from "@/lib/queries";
import { PHOTOS } from "@/lib/media";
import { EmptyState, PageHeader } from "@/components/ui";
import { PhotoBand } from "@/components/Visuals";
import { recognitionLevel } from "@/lib/user-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recognition" };

export default async function RecognitionPage() {
  const leaders = (await getLeaderboard()).filter((r) => r.points > 0);
  return (
    <>
      <PageHeader eyebrow="Community recognition" title="People moving climate justice forward" tone="butter" photo={PHOTOS["community-tree-planting"]}>
        Transparent recognition for reporting incidents and verified climate, policy and environmental action.
      </PageHeader>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          <div className="card"><p className="eyebrow">Incident report</p><p className="mt-2 font-display text-3xl font-bold">10 points</p><p className="text-sm text-ink-soft">Awarded once, when a moderator approves the report.</p></div>
          <div className="card"><p className="eyebrow">Verified action</p><p className="mt-2 font-display text-3xl font-bold">20–30 points</p><p className="text-sm text-ink-soft">Climate justice, policy participation, environmental or community activity, checked against evidence.</p></div>
          <div className="card"><p className="eyebrow">Kudos</p><p className="mt-2 font-display text-3xl font-bold">15 points</p><p className="text-sm text-ink-soft">Awarded by a moderator with a written reason, visible in the audit log.</p></div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Recognition board</h2>
          <p className="mt-1 text-sm text-ink-soft">Only participants with a public profile and at least one verified award are shown. Points are not votes, money or official endorsement.</p>
          {leaders.length === 0 ? (
            <div className="mt-4"><EmptyState title="No recognition awarded yet" action={{ href: "/login", label: "Create an account" }}>When incident reports and actions are reviewed, this board will fill from real records.</EmptyState></div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-softwhite">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
                  <tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Participant</th><th className="px-4 py-3">Recognition</th><th className="px-4 py-3">Points</th><th className="px-4 py-3">Reports</th><th className="px-4 py-3">Actions</th><th className="px-4 py-3">Kudos</th></tr>
                </thead>
                <tbody>
                  {leaders.map((r, i) => (
                    <tr key={r.userId} className="border-b border-ink/5 last:border-0">
                      <td className="px-4 py-3 font-display font-bold">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold">{r.displayName}</td>
                      <td className="px-4 py-3 text-ink-soft">{recognitionLevel(r.points).label}</td>
                      <td className="px-4 py-3 font-bold">{r.points}</td>
                      <td className="px-4 py-3">{r.reports}</td>
                      <td className="px-4 py-3">{r.activities}</td>
                      <td className="px-4 py-3">{r.kudos ? `${Math.round(r.kudos / 15)}` : "0"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <PhotoBand
          photoKey="community-dialogue"
          eyebrow="Why recognition matters"
          title="Care, consistency and courage deserve to be seen."
          action={{ href: "/login", label: "Join and take part" }}
        >
          <p>Recognition makes participation visible without turning civic action into a competition. Anyone can still contribute anonymously, and anonymous contributions carry the same weight in insights.</p>
        </PhotoBand>

        <p className="text-center text-sm">
          Want to see how recognition connects to evidence? <Link href="/understand" className="font-semibold underline">Read collective insights</Link>.
        </p>
      </div>
    </>
  );
}
