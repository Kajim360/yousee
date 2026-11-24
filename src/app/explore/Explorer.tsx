"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ExploreMap, type MapPoint, type AreaBubble } from "@/components/map";
import { CATEGORIES, EMOTIONS, KINDS, categoryLabel, categoryShort, categoryTone, cognitiveLabel, emotionMeta } from "@/lib/domain";
import { CategoryBadge, EmotionDot, LayerTag } from "@/components/ui";
import type { PublicContribution } from "@/lib/queries";

type Area = { id: string; name: string; lat: number; lng: number };

export function Explorer({
  center,
  zoom,
  items,
  areas,
  sources,
}: {
  center: [number, number];
  zoom: number;
  items: PublicContribution[];
  areas: Area[];
  sources: { name: string; url: string; limitations: string }[];
}) {
  const [initiative, setInitiative] = useState("all");
  const [category, setCategory] = useState("all");
  const [emotion, setEmotion] = useState("all");
  const [kind, setKind] = useState("all");
  const [area, setArea] = useState("all");
  const [showSynthetic, setShowSynthetic] = useState(true);
  const [layer, setLayer] = useState<"points" | "districts">("points");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (initiative === "all" || i.initiative === initiative) &&
          (category === "all" || i.category === category) &&
          (emotion === "all" || (emotion === "none" ? !i.emotion : i.emotion === emotion)) &&
          (kind === "all" || i.kind === kind) &&
          (area === "all" || i.areaId === area) &&
          (showSynthetic || !i.isSynthetic) &&
          (!q || `${i.title} ${i.body}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [items, initiative, category, emotion, kind, area, showSynthetic, q]
  );

  const points: MapPoint[] = filtered
    .filter((i) => i.lat != null && i.lng != null)
    .map((i) => ({
      id: i.id,
      lat: i.lat!,
      lng: i.lng!,
      color: emotionMeta(i.emotion)?.color ?? "#FFFCF7",
      radius: i.locationPrecision === "exact" ? 7 : i.locationPrecision === "approximate" ? 9 : 11,
      dashed: i.locationPrecision !== "exact",
      title: i.title,
      subtitle: `${categoryLabel(i.category)} · ${i.areaName ?? "District unknown"}`,
      body: i.body.length > 160 ? i.body.slice(0, 160) + "…" : i.body,
      badge: i.isSynthetic ? "Synthetic demo" : undefined,
    }));

  const bubbles: AreaBubble[] = areas.map((a) => {
    const n = filtered.filter((i) => i.areaId === a.id).length;
    return { id: a.id, name: a.name, lat: a.lat, lng: a.lng, count: n, label: n ? `${n} contribution${n > 1 ? "s" : ""}` : "No contributions yet. This is a gap, not evidence of no issues." };
  });

  const sel = items.find((i) => i.id === selected);
  const areaSel = areas.find((a) => a.id === area);
  const areaItems = areaSel ? filtered : [];
  const areaCats = Object.entries(
    areaItems.reduce<Record<string, number>>((acc, i) => ((acc[i.category] = (acc[i.category] ?? 0) + 1), acc), {})
  ).sort((a, b) => b[1] - a[1]);
  const noLoc = filtered.filter((i) => i.lat == null).length;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-4" aria-label="Filters">
        <input className="input" placeholder="Search experiences…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        <Select label="Initiative" value={initiative} onChange={setInitiative} options={[["all", "All initiatives"], ["shelens", "SheLens"], ["yousee", "YouSee Open City"]]} />
        <Select label="District (kecamatan)" value={area} onChange={setArea} options={[["all", "Whole city"], ...areas.map((a) => [a.id, a.name] as [string, string])]} />
        <Select label="Topic" value={category} onChange={setCategory} options={[["all", "All topics"], ...CATEGORIES.map((c) => [c.id, c.label] as [string, string])]} />
        <Select label="Feeling" value={emotion} onChange={setEmotion} options={[["all", "All feelings"], ...EMOTIONS.map((e) => [e.id, e.label] as [string, string]), ["none", "Not given"]]} />
        <Select label="Type" value={kind} onChange={setKind} options={[["all", "All types"], ...KINDS.map((k) => [k.id, k.label] as [string, string])]} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showSynthetic} onChange={(e) => setShowSynthetic(e.target.checked)} />
          Show synthetic demo records
        </label>
        <div className="card !p-4 text-xs">
          <p className="font-semibold">Legend: citizen-selected feeling</p>
          <ul className="mt-2 grid grid-cols-2 gap-1">
            {EMOTIONS.map((e) => (
              <li key={e.id} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-ink/40" style={{ background: e.color }} /> {e.label}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border border-ink/40 bg-softwhite" /> Not given
            </li>
          </ul>
          <p className="mt-2 text-ink-soft">Dashed, larger circles = approximate or district-level location.</p>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-ink/20 bg-softwhite p-1" role="tablist">
            {(["points", "districts"] as const).map((l) => (
              <button key={l} role="tab" aria-selected={layer === l} onClick={() => setLayer(l)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${layer === l ? "bg-ink text-softwhite" : ""}`}>
                {l === "points" ? "Experiences" : "District aggregation"}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-soft">
            {filtered.length} shown{noLoc ? ` · ${noLoc} without location` : ""}
          </p>
        </div>
        <div className="h-[460px] overflow-hidden rounded-2xl border border-ink/10">
          <ExploreMap center={center} zoom={zoom} points={points} bubbles={bubbles} showBubbles={layer === "districts"} onSelect={setSelected} />
        </div>

        {sel && (
          <article className="card border-ink/30" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <LayerTag kind="citizen" />
              {sel.isSynthetic && <LayerTag kind="synthetic" />}
              <CategoryBadge id={sel.category} label={categoryLabel(sel.category)} />
              <button className="ml-auto text-sm text-ink-soft underline" onClick={() => setSelected(null)}>Close</button>
            </div>
            <h3 className="mt-3 text-xl font-bold">{sel.title}</h3>
            <p className="mt-2 whitespace-pre-line">{sel.body}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {sel.emotion && <LayerTag kind="emotion"><EmotionDot id={sel.emotion} /> Felt: {emotionMeta(sel.emotion)?.label}</LayerTag>}
              {sel.cognitiveType && <LayerTag kind="spatial">{cognitiveLabel(sel.cognitiveType)}</LayerTag>}
              <LayerTag kind="spatial">{sel.areaName ?? "District unknown"} · location {sel.locationPrecision.replace("_", " ")}</LayerTag>
            </div>
            {sel.observation && <p className="mt-3 text-sm"><LayerTag kind="observation" /> {sel.observation}</p>}
            {sel.hasMedia && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/api/media/${sel.id}`} alt="Photo shared with this contribution" className="mt-3 max-h-64 rounded-xl object-cover" loading="lazy" />
            )}
            <p className="mt-3 text-xs text-ink-soft">
              Shared {new Date(sel.createdAt).toLocaleDateString()} · {sel.pseudonym ? `as “${sel.pseudonym}”` : "anonymously"}
            </p>
          </article>
        )}

        {areaSel && (
          <div className="card">
            <p className="eyebrow">What is known about {areaSel.name}</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Community contributions ({areaItems.length})</p>
                {areaCats.length ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {areaCats.map(([c, n]) => (
                      <li key={c} className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{background: categoryTone(c)}} />{categoryLabel(c)}: {n}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-soft">No contributions match these filters. This shows a participation gap, not an absence of issues.</p>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold">Official sources to consult</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-sky-deep underline">{s.name}</a>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-ink-soft">District-level official datasets are not yet loaded into YouSee. See <Link href="/data" className="underline">Data & Sources</Link>.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.slice(0, 12).map((i) => (
            <button key={i.id} onClick={() => setSelected(i.id)} className="card text-left hover:border-ink/30">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-display text-[10px] font-bold text-ink/60">{categoryShort(i.category)}</span>
                <span className="font-semibold">{i.areaName ?? "No location"}</span>
                {i.emotion && <EmotionDot id={i.emotion} />}
                {i.initiative === "shelens" && <span className="chip bg-rose/60">SheLens</span>}
                {i.isSynthetic && <LayerTag kind="synthetic" />}
              </div>
              <p className="mt-2 font-semibold">{i.title}</p>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="card text-center text-sm text-ink-soft">
            Nothing matches these filters yet. <Link href="/share" className="font-semibold underline">Be the first to share</Link>.
          </div>
        )}
      </section>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  );
}
