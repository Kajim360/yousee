import type { Metadata } from "next";
import { PHOTOS } from "@/lib/media";
import { getSources } from "@/lib/queries";
import { LayerTag, Notice, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Data & Sources" };

export default async function DataPage() {
  const sources = await getSources();
  return (
    <>
      <PageHeader eyebrow="Data & Sources" title="What YouSee knows, and what it doesn't" photo={PHOTOS["environment-coast"]}>
        Every source is documented with its publisher, coverage, licence, limitations and processing history. We start small and expand only with reliable, legally usable data.
      </PageHeader>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <Notice tone="butter">
          <strong>Current state:</strong> official datasets (BMKG, BPS, RTRW/RPJMD, drainage, facilities, official boundaries) are <em>referenced</em> but not yet ingested. District locations are approximate centroids. YouSee does not scrape websites or access restricted LAPOR! records.
        </Notice>
        <div className="grid gap-4 md:grid-cols-2">
          {sources.map((s) => (
            <article key={s.id} className="card">
              <div className="flex flex-wrap items-center gap-2">
                <LayerTag kind={s.sourceType === "synthetic" ? "synthetic" : s.sourceType === "community" ? "citizen" : "evidence"}>{s.sourceType}</LayerTag>
                <span className="text-xs text-ink-soft">Last checked {s.lastChecked}</span>
              </div>
              <h2 className="mt-2 text-lg font-bold">
                <a href={s.url} className="underline" target={s.url.startsWith("http") ? "_blank" : undefined} rel="noreferrer">{s.name}</a>
              </h2>
              <p className="text-xs text-ink-soft">{s.publisher}</p>
              <p className="mt-2 text-sm">{s.description}</p>
              <dl className="mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-xs">
                <dt className="font-semibold">Coverage</dt><dd>{s.coverage}</dd>
                <dt className="font-semibold">Resolution</dt><dd>{s.spatialResolution ?? "n/a"}</dd>
                <dt className="font-semibold">Licence</dt><dd>{s.license}</dd>
                <dt className="font-semibold">Quality</dt><dd>{s.dataQuality}</dd>
                <dt className="font-semibold">Processing</dt><dd>{s.processingHistory}</dd>
                <dt className="font-semibold text-rose-deep">Limitations</dt><dd>{s.limitations}</dd>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
