import type { Metadata } from "next";
import { PHOTOS } from "@/lib/media";
import { getOpportunities } from "@/lib/queries";
import { aiConfigured } from "@/lib/ai";
import { Notice, PageHeader } from "@/components/ui";
import { AskYourCity } from "./AskYourCity";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connect" };

const KIND_LABEL: Record<string, string> = { service: "Public service", education: "Education", employment: "Employment & skills", community: "Community & government", information: "Information" };

export default async function ConnectPage() {
  const ops = await getOpportunities();
  return (
    <>
      <PageHeader eyebrow="04 · Connect" title="Ask Your City" tone="sky" photo={PHOTOS["environment-mangrove"]}>
        Questions answered only from documented sources and moderated community contributions. If YouSee doesn&apos;t know, it says so.
      </PageHeader>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <AskYourCity aiEnabled={aiConfigured()} />
        </section>
        <section className="space-y-4">
          <div>
            <p className="eyebrow">Verified resources</p>
            <h2 className="mt-1 text-2xl font-bold">Services, information & opportunities</h2>
          </div>
          <Notice tone="butter">YouSee links only to official or established organisations. Eligibility, deadlines and contact details change, so always confirm on the official site.</Notice>
          {ops.map((o) => (
            <a key={o.id} href={o.url} target="_blank" rel="noreferrer" className="card block !p-4 hover:border-ink/30">
              <span className="chip bg-sky/60">{KIND_LABEL[o.kind] ?? o.kind}</span>
              <p className="mt-2 font-semibold">{o.title}</p>
              <p className="text-xs text-ink-soft">{o.organization} · {o.geographicScope}</p>
              <p className="mt-1 text-sm">{o.description}</p>
              <p className="mt-2 text-xs text-ink-soft">Last checked {o.lastVerified}. {o.verificationNote}</p>
            </a>
          ))}
        </section>
      </div>
    </>
  );
}
