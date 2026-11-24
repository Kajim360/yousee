import Link from "next/link";
import { getStats, getInsightsList, getPublishedPosts } from "@/lib/queries";
import { ConfidenceTag, StatusTag } from "@/components/ui";
import { PHOTOS, PHOTO_DISCLOSURE } from "@/lib/media";
import { PhotoBand, PhotoEssay, PhotoFrame } from "@/components/Visuals";

export const dynamic = "force-dynamic";

const JOURNEY = [
  { n: "01", t: "Explore", d: "See what residents have shared about places across Bandar Lampung, alongside documented public sources.", href: "/explore", c: "bg-sky" },
  { n: "02", t: "Share", d: "Describe an issue, an everyday experience or how you see a place. Anonymous, optional location, a few steps.", href: "/share", c: "bg-rose" },
  { n: "03", t: "Understand", d: "Collective insights that link back to the original records, with confidence, uncertainty and validation.", href: "/understand", c: "bg-butter" },
  { n: "04", t: "Connect", d: "Ask Your City — answers grounded in cited evidence, and verified links to services and opportunities.", href: "/connect", c: "bg-sky" },
  { n: "05", t: "Create Possibilities", d: "Community proposals with honest status — nothing is shown as approved without evidence.", href: "/possibilities", c: "bg-rose" },
];

const PIPELINE = ["Emotional mapping", "Cognitive mapping", "Spatial context", "AI-assisted interpretation", "Collective validation", "Civic insight"];

export default async function HomePage() {
  const [stats, ins, posts] = await Promise.all([getStats(), getInsightsList(), getPublishedPosts()]);
  return (
    <>
      <section className="relative overflow-hidden bg-softwhite">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-sky/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-[1.3fr_1fr] md:py-24">
          <div>
            <p className="eyebrow">Human-centered urban intelligence · Pilot: Bandar Lampung</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.05] md:text-6xl">
              Cities learn best <br className="hidden md:block" />
              from the people <span className="bg-butter px-2">who live in them.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              YouSee connects what residents experience every day with places, public evidence and careful, reviewable AI, so
              overlooked needs become visible and can be discussed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/share" className="btn-primary">Share an experience</Link>
              <Link href="/explore" className="btn-ghost">Explore the map</Link>
              <Link href="/shelens" className="btn-rose">SheLens</Link>
            </div>
          </div>
          <div className="space-y-4 self-center">
            <PhotoFrame photo={PHOTOS["city-manila"]} compact className="shadow-[0_18px_45px_rgba(38,56,74,0.18)]" />
            <div className="card">
              <p className="eyebrow">Live pilot status</p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <Stat label="Real contributions (approved)" value={stats.real} />
                <Stat label="Districts with contributions" value={`${stats.districts}/20`} />
                <Stat label="Insights published" value={stats.published} />
                <Stat label="Insights in community review" value={stats.review} />
              </dl>
              {stats.synthetic > 0 && (
                <p className="mt-4 rounded-lg bg-purple-100 px-3 py-2 text-xs text-purple-900">
                  Includes {stats.synthetic} clearly labelled <strong>synthetic demo</strong> records used to demonstrate the workflow. These are not real data and are not counted above.
                </p>
              )}
            </div>
            <p className="text-[11px] text-ink-soft">{PHOTO_DISCLOSURE}</p>
          </div>
        </div>
      </section>

      <PhotoEssay />

      <PhotoBand
        photoKey="flood-village"
        eyebrow="The view from the street"
        title="The experiences cities measure least are often the ones people live most."
        action={{ href: "/share", label: "Share your experience" }}
      >
        <p>Flooding, heat, unsafe crossings, inaccessible footpaths: these shape a day long before they appear in a dataset. YouSee keeps each account separate from interpretation, so it can be checked and understood.</p>
      </PhotoBand>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="eyebrow">Why YouSee exists</p>
            <h2 className="mt-2 text-3xl font-bold">Closing the civic feedback loop</h2>
          </div>
          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            {[
              ["Macro", "City data and planning documents can be disconnected from lived experience."],
              ["Meso", "Community knowledge is hard to turn into structured, reviewable planning evidence."],
              ["Micro", "People experience problems daily, but those experiences often go undocumented."],
            ].map(([t, d]) => (
              <div key={t} className="card">
                <p className="font-display text-lg font-bold">{t}</p>
                <p className="mt-1 text-sm text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16 text-softwhite">
        <div className="mx-auto max-w-7xl px-4">
          <p className="eyebrow !text-butter">How it works</p>
          <h2 className="mt-2 text-3xl font-bold">From one experience to shared understanding</h2>
          <ol className="mt-8 grid gap-3 md:grid-cols-6">
            {PIPELINE.map((p, i) => (
              <li key={p} className="rounded-xl border border-softwhite/15 bg-softwhite/5 p-4">
                <span className="font-display text-sm text-butter">Stage {i + 1}</span>
                <p className="mt-1 font-semibold">{p}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl text-sm text-softwhite/70">
            Every insight keeps eight layers distinct: citizen statement, citizen-selected feeling, physical observation, spatial
            context, external evidence, AI interpretation, human validation status and the published insight.{" "}
            <Link href="/methodology" className="text-butter underline">Read the methodology</Link>.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <p className="eyebrow">Participate</p>
        <h2 className="mt-2 text-3xl font-bold">Five ways to take part</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {JOURNEY.map((j) => (
            <Link key={j.n} href={j.href} className="card group transition hover:-translate-y-1">
              <span className={`inline-block rounded-lg ${j.c} px-2 py-1 font-display text-sm font-bold`}>{j.n}</span>
              <p className="mt-3 font-display text-lg font-bold group-hover:underline">{j.t}</p>
              <p className="mt-1 text-sm text-ink-soft">{j.d}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-8 overflow-hidden rounded-3xl bg-rose/50 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="eyebrow">Flagship initiative</p>
            <h2 className="mt-2 text-4xl font-bold">SheLens</h2>
            <p className="mt-3 text-lg text-ink">
              Making women&apos;s urban experiences visible: flooding, mobility, public spaces, services, heat and everyday comfort.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/share?initiative=shelens" className="btn-primary">Share through SheLens</Link>
              <Link href="/shelens" className="btn-ghost">Learn more</Link>
            </div>
          </div>
          <ul className="grid gap-3 text-sm">
            {[
              "Anonymous by default. No name, phone or email required.",
              "Share location only at district level if you prefer.",
              "Demographic questions are optional and need separate consent.",
              "Insights are reviewed by people before publication.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 rounded-xl bg-softwhite/80 px-4 py-3"><span aria-hidden="true" className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-ink" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Latest collective insights</p>
            <h2 className="mt-2 text-3xl font-bold">What the city is learning</h2>
          </div>
          <Link href="/understand" className="btn-ghost">All insights</Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {ins.slice(0, 3).map((i) => (
            <Link key={i.id} href={`/understand/${i.id}`} className="card hover:border-ink/30">
              <div className="flex flex-wrap gap-2">
                <StatusTag status={i.status} />
                <ConfidenceTag level={i.confidence} />
              </div>
              <p className="mt-3 font-display font-bold">{i.title}</p>
              <p className="mt-1 text-xs text-ink-soft">{i.recordCount} linked records · {i.validationCount} validation responses</p>
            </Link>
          ))}
          {ins.length === 0 && (
            <p className="text-sm text-ink-soft md:col-span-3">No insights yet. Moderators draft them from approved contributions, and residents review them before publication.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="grid overflow-hidden rounded-3xl bg-ink text-softwhite md:grid-cols-2">
          <div className="p-8 md:p-12">
            <p className="eyebrow !text-butter">Recognition</p>
            <h2 className="mt-2 text-3xl font-bold">Climate action deserves to be seen.</h2>
            <p className="mt-3 text-softwhite/80">Sign in to report incidents and submit verified climate-justice, policy and environmental actions. Moderators can award kudos with a written reason, and every point has a traceable source.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="btn-rose">Log in or join</Link>
              <Link href="/recognition" className="btn-ghost !border-softwhite/30 !text-softwhite">Recognition board</Link>
            </div>
          </div>
          <div className="relative min-h-64">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={PHOTOS["community-tree-planting"].src} alt={PHOTOS["community-tree-planting"].alt} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-soft">Photo: {PHOTOS["community-tree-planting"].credit} · {PHOTO_DISCLOSURE}</p>
      </section>

      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="flex items-end justify-between gap-3">
            <div><p className="eyebrow">From the team</p><h2 className="mt-2 text-3xl font-bold">Updates & announcements</h2></div>
            <Link href="/updates" className="btn-ghost">All updates</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {posts.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/updates/${p.id}`} className="card hover:border-ink/30">
                <span className="chip bg-butter">{p.kind}</span>
                <p className="mt-3 font-display font-bold">{p.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.excerpt}</p>
                <p className="mt-3 text-xs text-ink-soft">{p.authorName} · {p.publishedAt?.toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dd className="font-display text-3xl font-bold">{value}</dd>
      <dt className="text-xs text-ink-soft">{label}</dt>
    </div>
  );
}
