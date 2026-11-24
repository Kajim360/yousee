import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { aiInterpretations, areas, askLogs, consentRecords, contributions, contentPosts, initiatives, insights, moderationRecords, proposals, users, validationRecords } from "@/db/schema";
import { getAdmin, usingDefaultPasscode } from "@/lib/auth";
import { aiConfigured, aiModel } from "@/lib/ai";
import { ensureSeed } from "@/lib/seed";
import { ANALYTICAL_FRAMES, ACTIVITY_KINDS, CATEGORIES, PROPOSAL_STATUSES, categoryLabel, cognitiveLabel, emotionMeta } from "@/lib/domain";
import { PHOTO_KEYS, PHOTOS } from "@/lib/media";
import { bootstrapAdminCredentials } from "@/lib/admin-config";
import { getLeaderboard, getPendingActivities } from "@/lib/queries";
import { ConfidenceTag, LayerTag, Notice, StatusTag } from "@/components/ui";
import { adminCredentialLogin, editInsight, generateInsight, loginAction, logoutAction, moderateContribution, moderateProposal, reviewInterpretation, setInsightStatus } from "./actions";
import { awardKudos, createAdminAccount, createPost, reviewActivity, setPostStatus, updatePost } from "./community-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Moderation", robots: { index: false } };

const TABS = [
  ["queue", "Contribution queue"],
  ["insights", "Insights"],
  ["content", "Blog & announcements"],
  ["recognition", "Activities & kudos"],
  ["proposals", "Proposals"],
  ["admins", "Admin accounts"],
  ["ai", "AI evaluation"],
  ["audit", "Audit log"],
] as const;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; error?: string; msg?: string }> }) {
  const sp = await searchParams;
  await ensureSeed();
  const admin = await getAdmin();
  if (!admin) {
    return (
      <div className="mx-auto grid max-w-4xl gap-6 px-4 py-14 md:grid-cols-2">
        <form action={adminCredentialLogin} className="card space-y-4">
          <p className="eyebrow">Verified administrator</p>
          <h1 className="text-2xl font-bold">Admin sign-in</h1>
          <p className="text-sm text-ink-soft">Accounts are created and identity-verified manually by the system operator. There is no self-registration and no Google, Apple, Facebook or phone login for administrators.</p>
          {sp.error === "admin" && <Notice tone="rose">Those credentials were not recognised, or the account is not a verified admin.</Notice>}
          {bootstrapAdminCredentials().isDemo && (
            <Notice tone="butter">
              Preview bootstrap account (replace before production): <code>{bootstrapAdminCredentials().email}</code> / <code>{bootstrapAdminCredentials().password}</code>. Set <code>ADMIN_BOOTSTRAP_EMAIL</code> and <code>ADMIN_BOOTSTRAP_PASSWORD</code> to replace it.
            </Notice>
          )}
          <input name="email" type="email" className="input" placeholder="Admin email" required />
          <input name="password" type="password" className="input" placeholder="Private password" required />
          <button className="btn-primary w-full">Sign in as admin</button>
        </form>
        <form action={loginAction} className="card h-fit space-y-4">
          <p className="eyebrow">Operator fallback</p>
          <h2 className="text-xl font-bold">Shared moderator passcode</h2>
          <p className="text-sm text-ink-soft">For local testing and the initial setup only. Replace with individual verified accounts before a real pilot.</p>
          {sp.error === "1" && <Notice tone="rose">Incorrect passcode.</Notice>}
          {usingDefaultPasscode() && (
            <Notice tone="butter">
              Demo mode: <code>ADMIN_PASSCODE</code> is not set, so the default passcode <code>yousee-demo-admin</code> is active. Set <code>ADMIN_PASSCODE</code> and <code>SESSION_SECRET</code> before any real deployment.
            </Notice>
          )}
          <input name="name" className="input" placeholder="Your name or role (for the audit log)" maxLength={40} />
          <input name="passcode" type="password" className="input" placeholder="Passcode" required />
          <button className="btn-ghost w-full">Sign in with passcode</button>
        </form>
      </div>
    );
  }
  await ensureSeed();
  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "queue";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Admin & moderation</p>
          <h1 className="text-3xl font-bold">Hello, {admin.name}</h1>
          <p className="text-sm text-ink-soft">AI: {aiConfigured() ? `enabled (${aiModel()})` : "not configured. Heuristic fallbacks are active."}</p>
        </div>
        <form action={logoutAction}><button className="btn-ghost">Sign out</button></form>
      </div>
      <nav className="mt-6 flex flex-wrap gap-2">
        {TABS.map(([t, l]) => (
          <Link key={t} href={`/admin?tab=${t}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t ? "bg-ink text-softwhite" : "bg-softwhite border border-ink/15"}`}>{l}</Link>
        ))}
      </nav>
      {sp.msg && <div className="mt-4"><Notice tone="butter">{sp.msg}</Notice></div>}
      <div className="mt-6">
        {tab === "queue" && <Queue />}
        {tab === "insights" && <Insights />}
        {tab === "content" && <Content />}
        {tab === "recognition" && <Recognition />}
        {tab === "proposals" && <Proposals />}
        {tab === "admins" && <Admins />}
        {tab === "ai" && <AiEval />}
        {tab === "audit" && <Audit />}
      </div>
    </div>
  );
}

async function Queue() {
  const rows = await db
    .select({ c: contributions, areaName: areas.name, ini: initiatives.name, consent: consentRecords, hasMedia: sql<boolean>`exists(select 1 from contribution_media m where m.contribution_id = ${contributions.id})` })
    .from(contributions)
    .leftJoin(areas, eq(areas.id, contributions.areaId))
    .leftJoin(initiatives, eq(initiatives.id, contributions.initiativeId))
    .leftJoin(consentRecords, eq(consentRecords.contributionId, contributions.id))
    .where(inArray(contributions.status, ["pending", "flagged"]))
    .orderBy(desc(contributions.createdAt))
    .limit(50);
  const ids = rows.map((r) => r.c.id);
  const ai = ids.length ? await db.select().from(aiInterpretations).where(inArray(aiInterpretations.contributionId, ids)) : [];
  const recent = await db.select({ id: contributions.id, title: contributions.title, status: contributions.status }).from(contributions).where(inArray(contributions.status, ["approved", "rejected"])).orderBy(desc(contributions.createdAt)).limit(8);

  return (
    <div className="space-y-4">
      {rows.length === 0 && <Notice>The queue is empty. New contributions from Share will appear here.</Notice>}
      {rows.map(({ c, areaName, ini, consent, hasMedia }) => {
        const interp = ai.filter((a) => a.contributionId === c.id);
        return (
          <article key={c.id} className="card">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <StatusTag status={c.status} />
              <span className="chip bg-ink/5">{ini}</span>
              <span className="chip bg-ink/5">{categoryLabel(c.category)}</span>
              <span className="text-ink-soft">{c.createdAt.toLocaleString()}</span>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <LayerTag kind="citizen" />
                <h3 className="mt-2 text-lg font-bold">{c.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm">{c.body}</p>
                {c.observation && <p className="mt-2 text-sm"><LayerTag kind="observation" /> {c.observation}</p>}
                <ul className="mt-3 space-y-1 text-xs text-ink-soft">
                  <li>Feeling: {c.emotion ? emotionMeta(c.emotion)?.label : "not given"}{c.emotionNote ? `: “${c.emotionNote}”` : ""}</li>
                  {c.cognitiveType && <li>Cognitive map: {cognitiveLabel(c.cognitiveType)}</li>}
                  <li>Location: {c.geometryType} · public precision {c.locationPrecision} · {areaName ?? "no district"} <span className="text-rose-deep">(raw geometry restricted)</span></li>
                  <li>Participation: {c.participationMode}{c.pseudonym ? ` (“${c.pseudonym}”)` : ""}</li>
                  <li>Consent {consent?.consentVersion}: public {String(consent?.publicDisplay)}, research {String(consent?.researchUse)}, demographic {String(consent?.demographicUse)}</li>
                </ul>
                {hasMedia && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/${c.id}`} alt="Photo attached to contribution" className="mt-3 max-h-40 rounded-lg" loading="lazy" />
                )}
              </div>
              <div className="space-y-3">
                {interp.map((a) => {
                  const o = a.output as { suggestedCategory: string; themes: string[]; suggestedFrame: string; frameRationale: string; confidence: string; caveat: string };
                  const frame = ANALYTICAL_FRAMES.find((f) => f.id === o.suggestedFrame);
                  return (
                    <div key={a.id} className="rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2"><LayerTag kind="ai" /><span className="text-xs">{a.method}{a.model ? ` · ${a.model}` : ""} · {a.promptVersion}</span><StatusTag status={a.reviewStatus} /></div>
                      <p className="mt-2">Suggested topic: <strong>{categoryLabel(o.suggestedCategory)}</strong>{o.suggestedCategory !== c.category && " (differs from the resident's choice, which is kept)"}</p>
                      <p>Themes: {o.themes.join(", ") || "none"}</p>
                      <p className="mt-1">Exploratory frame: <span className="chip text-white" style={{ background: frame?.color }}>{frame?.label}</span> <ConfidenceTag level={o.confidence} /></p>
                      <p className="mt-1 text-xs text-ink-soft">{o.frameRationale} · {o.caveat}</p>
                      {a.reviewStatus === "pending" && (
                        <form action={reviewInterpretation} className="mt-2 flex flex-wrap gap-2">
                          <input type="hidden" name="id" value={a.id} />
                          <input name="note" className="input !py-1 text-xs" placeholder="Reviewer note (optional)" />
                          <button name="verdict" value="accepted" className="btn-ghost !py-1 text-xs">Accept suggestion</button>
                          <button name="verdict" value="rejected" className="btn-ghost !py-1 text-xs">Reject</button>
                        </form>
                      )}
                    </div>
                  );
                })}
                <form action={moderateContribution} className="space-y-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input name="note" className="input" placeholder="Moderation note (optional)" />
                  <div className="flex flex-wrap gap-2">
                    <button name="action" value="approved" className="btn-primary">Approve</button>
                    <button name="action" value="rejected" className="btn-ghost">Reject</button>
                    {c.status !== "flagged" && <button name="action" value="flagged" className="btn-rose">Flag</button>}
                  </div>
                </form>
              </div>
            </div>
          </article>
        );
      })}
      {recent.length > 0 && (
        <div className="card">
          <p className="font-semibold">Recently moderated</p>
          <ul className="mt-2 space-y-1 text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <span>{r.title}</span>
                <form action={moderateContribution} className="flex items-center gap-2">
                  <StatusTag status={r.status} />
                  <input type="hidden" name="id" value={r.id} />
                  <button name="action" value="pending" className="text-xs underline">Return to queue</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

async function Insights() {
  const [areaList, list] = await Promise.all([
    db.select().from(areas).orderBy(areas.name),
    db
      .select({
        i: insights,
        records: sql<number>`(select count(*)::int from insight_contributions x where x.insight_id = ${insights.id})`,
        validations: sql<number>`(select count(*)::int from validation_records v where v.insight_id = ${insights.id})`,
      })
      .from(insights)
      .orderBy(desc(insights.createdAt)),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <form action={generateInsight} className="card h-fit space-y-3">
        <h2 className="text-lg font-bold">Draft a new insight</h2>
        <p className="text-xs text-ink-soft">Uses approved contributions with research consent. The draft is stored separately and is not public until it has been reviewed.</p>
        <select name="initiative" className="input" aria-label="Initiative"><option value="">All initiatives</option><option value="shelens">SheLens</option><option value="yousee">YouSee Open City</option></select>
        <select name="category" className="input" aria-label="Topic"><option value="">All topics</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        <select name="areaId" className="input" aria-label="District"><option value="">Whole city</option>{areaList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="includeSynthetic" defaultChecked /> Include synthetic demo records</label>
        <button className="btn-primary w-full">Generate draft</button>
      </form>
      <div className="space-y-4">
        {list.length === 0 && <Notice>No insights yet.</Notice>}
        {list.map(({ i, records, validations }) => (
          <article key={i.id} className="card">
            <div className="flex flex-wrap items-center gap-2">
              <StatusTag status={i.status} />
              <ConfidenceTag level={i.confidence} />
              <span className="chip bg-ink/5">{i.method}{i.model ? ` · ${i.model}` : ""}</span>
              <span className="text-xs text-ink-soft">{records} records · {validations} validations</span>
              {["in_review", "published"].includes(i.status) && <Link className="ml-auto text-sm underline" href={`/understand/${i.id}`}>Public page</Link>}
            </div>
            <form action={editInsight} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={i.id} />
              <input name="title" defaultValue={i.title} className="input font-semibold" />
              <textarea name="summary" defaultValue={i.summary} className="input min-h-28 text-sm" />
              <button className="text-sm underline">Save edits (recorded as human-edited)</button>
            </form>
            <p className="mt-2 text-xs text-ink-soft">Uncertainty: {i.uncertaintyNote}</p>
            <form action={setInsightStatus} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={i.id} />
              {i.status === "draft" && <button name="status" value="in_review" className="btn-primary">Send to community review</button>}
              {i.status === "in_review" && <button name="status" value="published" className="btn-primary" disabled={validations === 0} title={validations === 0 ? "Needs at least one validation response" : ""}>Publish</button>}
              {i.status === "in_review" && <button name="status" value="draft" className="btn-ghost">Back to draft</button>}
              {i.status !== "archived" && <button name="status" value="archived" className="btn-ghost">Archive</button>}
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}

async function Proposals() {
  const list = await db.select({ p: proposals, areaName: areas.name }).from(proposals).leftJoin(areas, eq(areas.id, proposals.areaId)).orderBy(desc(proposals.createdAt));
  return (
    <div className="space-y-4">
      {list.length === 0 && <Notice>No proposals.</Notice>}
      {list.map(({ p, areaName }) => (
        <article key={p.id} className="card">
          <div className="flex flex-wrap gap-2 text-xs"><StatusTag status={p.moderation} /><span className="chip bg-ink/5">{p.status}</span><span>{areaName ?? "Citywide"}</span>{p.isSynthetic && <LayerTag kind="synthetic" />}</div>
          <h3 className="mt-2 font-bold">{p.title}</h3>
          <p className="text-sm text-ink-soft">{p.description}</p>
          <form action={moderateProposal} className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_2fr_auto]">
            <input type="hidden" name="id" value={p.id} />
            <select name="moderation" defaultValue={p.moderation} className="input" aria-label="Moderation"><option value="pending">Pending</option><option value="approved">Approved (visible)</option><option value="rejected">Rejected</option></select>
            <select name="status" defaultValue={p.status} className="input" aria-label="Status">{PROPOSAL_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            <input name="evidence" defaultValue={p.statusEvidenceUrl ?? ""} className="input" placeholder="Public evidence URL (required beyond Proposed)" />
            <button className="btn-primary">Save</button>
          </form>
        </article>
      ))}
    </div>
  );
}

async function AiEval() {
  const [agg] = await db
    .select({
      total: sql<number>`count(*)::int`,
      insufficient: sql<number>`count(*) filter (where not evidence_sufficient)::int`,
      helpful: sql<number>`count(*) filter (where helpful = true)::int`,
      unhelpful: sql<number>`count(*) filter (where helpful = false)::int`,
      llm: sql<number>`count(*) filter (where method = 'llm')::int`,
    })
    .from(askLogs);
  const [interp] = await db
    .select({
      total: sql<number>`count(*)::int`,
      accepted: sql<number>`count(*) filter (where review_status = 'accepted')::int`,
      rejected: sql<number>`count(*) filter (where review_status = 'rejected')::int`,
    })
    .from(aiInterpretations);
  const [val] = await db.select({ agree: sql<number>`count(*) filter (where verdict='agree')::int`, partially: sql<number>`count(*) filter (where verdict='partially')::int`, disagree: sql<number>`count(*) filter (where verdict='disagree')::int` }).from(validationRecords);
  const logs = await db.select().from(askLogs).orderBy(desc(askLogs.createdAt)).limit(20);
  const reviewed = interp.accepted + interp.rejected;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card"><p className="eyebrow">Ask Your City</p><p className="mt-2 text-sm">{agg.total} questions · {agg.llm} LLM answers · {agg.insufficient} flagged low-evidence · helpful {agg.helpful} / not helpful {agg.unhelpful}</p></div>
        <div className="card"><p className="eyebrow">Human agreement with AI suggestions</p><p className="mt-2 text-sm">{reviewed ? `${Math.round((interp.accepted / reviewed) * 100)}% accepted` : "No reviews yet"} ({interp.accepted} accepted / {interp.rejected} rejected / {interp.total - reviewed} pending)</p></div>
        <div className="card"><p className="eyebrow">Community validation of insights</p><p className="mt-2 text-sm">Agree {val.agree} · Partially {val.partially} · Disagree {val.disagree}</p></div>
      </div>
      <div className="card overflow-x-auto">
        <p className="font-semibold">Recent questions (check for hallucination and attribution)</p>
        <table className="mt-3 w-full text-left text-sm">
          <thead className="text-xs text-ink-soft"><tr><th className="py-1 pr-3">Question</th><th className="pr-3">Answer</th><th className="pr-3">Sources</th><th className="pr-3">Method</th><th>Helpful</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t border-ink/10 align-top">
                <td className="py-2 pr-3 font-semibold">{l.question}</td>
                <td className="max-w-md pr-3 text-xs">{l.answer.slice(0, 300)}{l.answer.length > 300 ? "…" : ""}</td>
                <td className="pr-3 text-xs">{(l.sources as { ref: string; sourceType: string }[]).map((s) => `${s.ref}(${s.sourceType})`).join(", ")}</td>
                <td className="pr-3 text-xs">{l.method}{!l.evidenceSufficient && " · low evidence"}</td>
                <td className="text-xs">{l.helpful === null ? "—" : l.helpful ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function Content() {
  const posts = await db.select().from(contentPosts).orderBy(desc(contentPosts.createdAt));
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form action={createPost} className="card h-fit space-y-3">
        <h2 className="text-lg font-bold">Write a post</h2>
        <p className="text-xs text-ink-soft">Only verified administrators can publish. Author and date are recorded automatically.</p>
        <select name="kind" className="input" aria-label="Post kind"><option value="blog">Blog post</option><option value="article">Article</option><option value="announcement">Announcement</option></select>
        <input name="title" className="input" placeholder="Title" maxLength={140} required />
        <textarea name="excerpt" className="input" placeholder="Short summary (optional)" maxLength={300} />
        <textarea name="body" className="input min-h-36" placeholder="Write the article or announcement…" required />
        <select name="coverKey" className="input" aria-label="Cover photo">
          <option value="">No cover photo</option>
          {PHOTO_KEYS.map((k) => <option key={k} value={k}>{PHOTOS[k].caption} ({PHOTOS[k].subject})</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="publish" defaultChecked /> Publish immediately</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> Pin announcement</label>
        <button className="btn-primary w-full">Save post</button>
        <p className="text-[11px] text-ink-soft">Cover photos are illustrative regional photography with a disclosure, not evidence.</p>
      </form>
      <div className="space-y-4">
        {posts.length === 0 && <Notice>No posts yet. Drafts and published posts will appear here.</Notice>}
        {posts.map((p) => (
          <article key={p.id} className="card">
            <div className="flex flex-wrap items-center gap-2"><StatusTag status={p.status} /><span className="chip bg-ink/5">{p.kind}</span>{p.pinned && <span className="chip bg-rose/60">Pinned</span>}<span className="text-xs text-ink-soft">{p.authorName} · {p.createdAt.toLocaleDateString()}</span></div>
            <form action={updatePost} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={p.id} />
              <input name="title" className="input font-semibold" defaultValue={p.title} />
              <textarea name="excerpt" className="input text-sm" defaultValue={p.excerpt} placeholder="Short summary" />
              <textarea name="body" className="input min-h-28 text-sm" defaultValue={p.body} />
              <button className="text-xs underline">Save edits</button>
            </form>
            <form action={setPostStatus} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={p.id} />
              {p.status !== "published" && <button name="status" value="published" className="btn-primary">Publish</button>}
              {p.status === "published" && <button name="status" value="draft" className="btn-ghost">Unpublish</button>}
              {p.status !== "archived" && <button name="status" value="archived" className="btn-ghost">Archive</button>}
              {p.status === "published" && <a href={`/updates/${p.id}`} className="btn-ghost" target="_blank" rel="noreferrer">View public page</a>}
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}

async function Recognition() {
  const [pending, leaders] = await Promise.all([getPendingActivities(), getLeaderboard()]);
  const participants = leaders.filter((l) => l.userId);
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold">Give kudos</h2>
        <p className="mt-1 text-sm text-ink-soft">Kudos add 15 points and require a written reason. The award is recorded in the audit log.</p>
        <form action={awardKudos} className="mt-3 grid gap-2 md:grid-cols-[1fr_1.5fr_auto]">
          <select name="userId" className="input" aria-label="Participant"><option value="">Choose a participant</option>{participants.map((p) => <option key={p.userId} value={p.userId}>{p.displayName} ({p.points} pts)</option>)}</select>
          <input name="note" className="input" placeholder="Reason, e.g. facilitated a community drainage mapping session" required />
          <button className="btn-primary">Award kudos</button>
        </form>
      </div>
      <div>
        <h2 className="text-xl font-bold">Actions awaiting review ({pending.length})</h2>
        <div className="mt-3 space-y-3">
          {pending.length === 0 && <Notice>No pending actions.</Notice>}
          {pending.map(({ a, displayName }) => (
            <article key={a.id} className="card">
              <div className="flex flex-wrap items-center gap-2"><StatusTag status={a.status} /><span className="chip bg-ink/5">{ACTIVITY_KINDS.find((k) => k.id === a.kind)?.label ?? a.kind}</span><span className="text-xs text-ink-soft">{displayName} · {a.createdAt.toLocaleDateString()}</span></div>
              <p className="mt-2 font-semibold">{a.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{a.description}</p>
              {a.evidenceUrl && <p className="mt-1 text-xs">Evidence: <a className="underline" href={a.evidenceUrl} target="_blank" rel="noreferrer">{a.evidenceUrl}</a></p>}
              <form action={reviewActivity} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={a.id} />
                <input name="note" className="input !w-auto flex-1" placeholder="Review note (optional)" />
                <button name="verdict" value="approved" className="btn-primary">Approve</button>
                <button name="verdict" value="declined" className="btn-ghost">Decline</button>
              </form>
            </article>
          ))}
        </div>
      </div>
      <div className="card">
        <h2 className="text-xl font-bold">Recognition board</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {participants.map((p, i) => <li key={p.userId} className="flex justify-between border-b border-ink/5 py-1"><span>{i + 1}. {p.displayName}</span><span>{p.points} points · {p.reports} reports · {p.activities} actions</span></li>)}
          {participants.length === 0 && <li className="text-ink-soft">No participants yet.</li>}
        </ul>
      </div>
    </div>
  );
}

async function Admins() {
  const list = await db.select().from(users).where(eq(users.role, "admin")).orderBy(desc(users.createdAt));
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form action={createAdminAccount} className="card h-fit space-y-3">
        <h2 className="text-lg font-bold">Issue private admin credentials</h2>
        <p className="text-xs text-ink-soft">Check the person&apos;s identity offline first. Give them the password privately. This is the only way admin accounts are created.</p>
        <input name="displayName" className="input" placeholder="Full name or role" required />
        <input name="email" type="email" className="input" placeholder="Work email" required />
        <input name="password" type="password" className="input" placeholder="Private password (12+ characters)" minLength={12} required />
        <button className="btn-primary w-full">Create verified admin</button>
      </form>
      <div className="card">
        <h2 className="text-lg font-bold">Verified administrators</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {list.map((u) => (
            <li key={u.id} className="rounded-xl border border-ink/10 px-3 py-2">
              <p className="font-semibold">{u.displayName}</p>
              <p className="text-xs text-ink-soft">{u.email} · {u.verified ? "verified" : "unverified"} · {u.provider}{u.isDemoAdmin ? " · preview bootstrap" : ""}</p>
              <p className="mt-1 text-xs text-ink-soft">{u.verificationNote}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

async function Audit() {
  const rows = await db.select().from(moderationRecords).orderBy(desc(moderationRecords.createdAt)).limit(100);
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs text-ink-soft"><tr><th className="py-1 pr-3">When</th><th className="pr-3">Actor</th><th className="pr-3">Target</th><th className="pr-3">Action</th><th>Note</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-ink/10">
              <td className="py-2 pr-3 text-xs">{r.createdAt.toLocaleString()}</td>
              <td className="pr-3">{r.actor}</td>
              <td className="pr-3 text-xs">{r.targetType} {r.targetId?.slice(0, 8)}</td>
              <td className="pr-3 font-mono text-xs">{r.action}</td>
              <td className="text-xs">{r.note}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5} className="py-4 text-ink-soft">No actions recorded yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
