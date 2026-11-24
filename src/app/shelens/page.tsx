import type { Metadata } from "next";
import Link from "next/link";
import { getPublicContributions } from "@/lib/queries";
import { PHOTOS } from "@/lib/media";
import { PageHeader, Notice } from "@/components/ui";
import { CATEGORIES } from "@/lib/domain";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "SheLens" };

const PRINCIPLES = [
  ["Inclusion", "Meaningful participation across different communities."],
  ["Visibility", "Capture experiences that conventional datasets overlook."],
  ["Context", "Interpret contributions within spatial and social context."],
  ["Evidence", "Connect lived experience with relevant urban information."],
  ["Agency", "Help people communicate their needs in their own words."],
  ["Accountability", "Keep citizen statements, evidence and AI interpretation distinct."],
  ["Representation", "Show whose experiences are present, and whose are missing."],
];

export default async function SheLensPage() {
  const items = await getPublicContributions({ initiative: "shelens" });
  const real = items.filter((i) => !i.isSynthetic).length;
  return (
    <>
      <PageHeader eyebrow="Flagship initiative" title="SheLens: making women's urban experiences visible" tone="rose" photo={PHOTOS["community-volunteers"]}>
        Urban experiences are not distributed equally. SheLens invites women, and others who face additional barriers, to share how
        Bandar Lampung works for them every day, so those experiences can inform inclusive urban understanding.
      </PageHeader>
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12">
        <section className="grid gap-6 md:grid-cols-3">
          <div className="card">
            <p className="eyebrow">Purpose</p>
            <p className="mt-2">Make overlooked urban experiences visible, interpretable and meaningful in how the city understands and responds to its communities.</p>
          </div>
          <div className="card">
            <p className="eyebrow">Whose experiences</p>
            <p className="mt-2">Women of all ages, caregivers, older women, women with disabilities, students and workers, and anyone who faces extra barriers to using the city. You decide whether to describe yourself.</p>
          </div>
          <div className="card">
            <p className="eyebrow">Current status</p>
            <p className="mt-2"><strong>{real}</strong> real approved SheLens contributions so far{items.length - real ? `, plus ${items.length - real} synthetic demo records` : ""}. This is a pilot. No findings are claimed yet.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">What you can share</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.id !== "other").map((c) => <span key={c.id} className="chip bg-softwhite border border-ink/15 !px-3 !py-1.5 text-sm">{c.label}</span>)}
          </div>
          <p className="mt-3 max-w-3xl text-ink-soft">For example: a flooded route to school, an angkot stop with no shade, a footpath you can&apos;t use with a stroller, a park that feels good in the morning, a clinic queue, or a place that holds a memory.</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="text-xl font-bold">How your information is used</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              <li>A moderator checks your contribution for personal details before it becomes public.</li>
              <li>It appears on the map only at the precision you chose. “Unsafe” experiences are never shown near-exact.</li>
              <li>Together with others, it may inform a draft insight, which is reviewed by residents before publication.</li>
              <li>Insights always link back to the original words, so your perspective is not replaced by an AI summary.</li>
            </ol>
          </div>
          <div className="card">
            <h2 className="text-xl font-bold">How your privacy is protected</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
              <li>No account, name, phone or email is required.</li>
              <li>District-only location is the default for SheLens.</li>
              <li>Photo location metadata is removed in your browser before upload.</li>
              <li>Demographic questions are optional, need separate consent and are only reported in groups of 5 or more.</li>
              <li>You can delete your contribution at any time from <Link className="underline" href="/me">My contributions</Link>.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold">Principles</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {PRINCIPLES.map(([t, d]) => <div key={t} className="card !p-4"><p className="font-display font-bold">{t}</p><p className="mt-1 text-sm text-ink-soft">{d}</p></div>)}
          </div>
        </section>

        <Notice tone="rose">SheLens is not an emergency or reporting service and is not monitored in real time. If you are in danger, contact emergency services or the SAPA 129 hotline.</Notice>
        <div className="flex flex-wrap gap-3">
          <Link href="/share?initiative=shelens" className="btn-primary">Share through SheLens</Link>
          <Link href="/explore" className="btn-ghost">See SheLens experiences on the map</Link>
        </div>
      </div>
    </>
  );
}
