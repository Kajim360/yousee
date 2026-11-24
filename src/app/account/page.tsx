import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, recognitionLevel } from "@/lib/user-auth";
import { getAccountData } from "@/lib/queries";
import { PHOTOS } from "@/lib/media";
import { Notice, PageHeader, StatusTag } from "@/components/ui";
import { ActivityForm } from "./ActivityForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const d = await getAccountData(user.id);
  const level = recognitionLevel(d.points);

  return (
    <>
      <PageHeader eyebrow="Your account" title={`Hello, ${user.displayName}`} tone="sky" photo={PHOTOS["community-volunteers"]}>
        Report incidents, submit verified climate and environmental action, and follow the recognition you have earned.
      </PageHeader>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="card"><p className="eyebrow">Recognition points</p><p className="mt-2 font-display text-4xl font-bold">{d.points}</p></div>
          <div className="card"><p className="eyebrow">Current level</p><p className="mt-2 font-display text-xl font-bold">{level.label}</p>{level.next && <p className="text-xs text-ink-soft">{level.remaining} points until {level.next}</p>}</div>
          <div className="card"><p className="eyebrow">Kudos received</p><p className="mt-2 font-display text-4xl font-bold">{d.kudos}</p></div>
          <div className="card"><p className="eyebrow">Recognition board</p><p className="mt-2 font-display text-xl font-bold">{d.rank ? `Rank ${d.rank}` : "Not ranked yet"}</p><Link className="mt-1 block text-xs underline" href="/recognition">View the board</Link></div>
        </section>

        <Notice tone="butter">Points recognise participation. They are not money, votes, official endorsement or a measure of who cares most. Only public display names appear on the recognition board.</Notice>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h2 className="text-xl font-bold">Report an incident</h2>
            <p className="mt-1 text-sm text-ink-soft">Your signed-in reports are linked to this account, and an approved report earns 10 points. You may still share anonymously at any time.</p>
            <Link href="/share" className="btn-primary mt-4">Share an experience or incident</Link>
            <h3 className="mt-6 font-semibold">Your reports ({d.reports.length})</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {d.reports.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-ink/10 px-3 py-2">
                  <span>{r.title}</span><StatusTag status={r.status} />
                </li>
              ))}
              {d.reports.length === 0 && <li className="text-ink-soft">No reports yet.</li>}
            </ul>
            {d.proposals.length > 0 && (
              <>
                <h3 className="mt-5 font-semibold">Your proposals</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {d.proposals.map((p) => <li key={p.id} className="rounded-xl border border-ink/10 px-3 py-2">{p.title}</li>)}
                </ul>
              </>
            )}
          </div>
          <div className="card">
            <h2 className="text-xl font-bold">Submit an action for recognition</h2>
            <p className="mb-4 mt-1 text-sm text-ink-soft">Climate justice advocacy, policy participation, environmental activities and community organising. A moderator checks each claim and its evidence before points are awarded.</p>
            <ActivityForm />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">Action review status</h2>
            <ul className="mt-3 space-y-2">
              {d.activities.map((a) => (
                <li key={a.id} className="card !p-4">
                  <div className="flex items-center justify-between gap-2"><p className="font-semibold">{a.title}</p><StatusTag status={a.status} /></div>
                  <p className="mt-1 text-xs text-ink-soft">{a.kind.replace("_", " ")} · {a.createdAt.toLocaleDateString()}</p>
                  {a.reviewNote && <p className="mt-1 text-xs">Reviewer note: {a.reviewNote}</p>}
                </li>
              ))}
              {d.activities.length === 0 && <li className="text-sm text-ink-soft">No actions submitted yet.</li>}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold">Rewards and kudos</h2>
            <ul className="mt-3 space-y-2">
              {d.rewards.map((r) => (
                <li key={r.id} className="card !p-4">
                  <div className="flex items-center justify-between gap-2"><p className="font-semibold">{r.title}</p><span className="chip bg-butter">+{r.points} points</span></div>
                  {r.description && <p className="mt-1 text-sm text-ink-soft">{r.description}</p>}
                  <p className="mt-1 text-xs text-ink-soft">{r.createdAt.toLocaleDateString()} · from {r.awardedBy}</p>
                </li>
              ))}
              {d.rewards.length === 0 && <li className="text-sm text-ink-soft">No rewards yet. An approved incident report is the first step.</li>}
            </ul>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6 text-sm">
          <span className="text-ink-soft">Signed in with {user.provider === "credentials" ? "email and password" : user.provider === "phone" ? "phone verification" : user.provider}{user.verified ? " · verified" : " · email not independently verified"}</span>
          <form action="/api/auth/logout" method="post" className="ml-auto"><button className="btn-ghost">Sign out</button></form>
        </div>
      </div>
    </>
  );
}
