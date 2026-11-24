import type { ReactNode } from "react";
import Link from "next/link";
import { categoryShort, categoryTone, emotionMeta } from "@/lib/domain";
import { PHOTO_DISCLOSURE, type Photo } from "@/lib/media";
import { PhotoFrame } from "./Visuals";

/** Colour dot instead of an emoji/glyph icon. */
export function EmotionDot({ id, className = "" }: { id: string | null | undefined; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-ink/25 align-middle ${className}`}
      style={{ background: emotionMeta(id)?.color ?? "#FFFCF7" }}
    />
  );
}

/** Two-letter topic badge instead of an emoji/glyph icon. */
export function CategoryBadge({ id, label }: { id: string | null; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-ink" style={{ background: categoryTone(id) }}>
      <span className="font-display text-[10px] font-bold opacity-70">{categoryShort(id)}</span>
      {label}
    </span>
  );
}

export function PageHeader({ eyebrow, title, children, tone = "ivory", photo }: { eyebrow: string; title: string; children?: ReactNode; tone?: "ivory" | "rose" | "sky" | "butter"; photo?: Photo }) {
  const bg = { ivory: "bg-softwhite", rose: "bg-rose/40", sky: "bg-sky/40", butter: "bg-butter/50" }[tone];
  return (
    <section className={`${bg} border-b border-ink/10`}>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:py-14 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-bold text-ink md:text-5xl">{title}</h1>
          {children && <div className="mt-4 max-w-3xl text-base text-ink-soft md:text-lg">{children}</div>}
        </div>
        {photo && (
          <div>
            <PhotoFrame photo={photo} compact className="shadow-[0_10px_35px_rgba(38,56,74,0.12)]" />
            <p className="mt-2 text-[11px] leading-snug text-ink-soft">{PHOTO_DISCLOSURE}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/** Provenance layers — keeps evidence types visually distinct everywhere. */
const LAYERS = {
  citizen: { label: "Citizen statement", cls: "bg-rose/60 text-ink" },
  emotion: { label: "Citizen-selected feeling", cls: "bg-butter text-ink" },
  observation: { label: "Physical observation", cls: "bg-amber-100 text-ink" },
  spatial: { label: "Spatial context", cls: "bg-sky/70 text-ink" },
  evidence: { label: "External evidence", cls: "bg-emerald-100 text-emerald-900" },
  ai: { label: "AI interpretation", cls: "bg-violet-100 text-violet-900" },
  validation: { label: "Human validation", cls: "bg-ink text-softwhite" },
  insight: { label: "Published insight", cls: "bg-ink/10 text-ink" },
  synthetic: { label: "Synthetic demo", cls: "bg-purple-200 text-purple-900" },
} as const;
export type LayerKind = keyof typeof LAYERS;

export function LayerTag({ kind, children }: { kind: LayerKind; children?: ReactNode }) {
  const l = LAYERS[kind];
  return <span className={`chip ${l.cls}`}>{children ?? l.label}</span>;
}

export function ConfidenceTag({ level }: { level: string }) {
  const cls = level === "high" ? "bg-emerald-100 text-emerald-900" : level === "medium" ? "bg-butter text-ink" : "bg-rose/50 text-ink";
  return <span className={`chip ${cls}`}>Confidence: {level}</span>;
}

export function StatusTag({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-ink/10",
    in_review: "bg-butter",
    published: "bg-emerald-100 text-emerald-900",
    archived: "bg-ink/10",
    pending: "bg-butter",
    approved: "bg-emerald-100 text-emerald-900",
    rejected: "bg-rose/60",
    flagged: "bg-rose",
  };
  return <span className={`chip ${map[status] ?? "bg-ink/10"}`}>{status.replace("_", " ")}</span>;
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/25 bg-softwhite p-8 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm text-ink-soft">{children}</div>}
      {action && (
        <Link href={action.href} className="btn-primary mt-4">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Notice({ children, tone = "sky" }: { children: ReactNode; tone?: "sky" | "rose" | "butter" }) {
  const cls = { sky: "bg-sky/40 border-sky-deep/30", rose: "bg-rose/40 border-rose-deep/30", butter: "bg-butter/60 border-amber-400/40" }[tone];
  return <div className={`rounded-xl border px-4 py-3 text-sm text-ink ${cls}`}>{children}</div>;
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-ink [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:mt-1 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:font-semibold [&_a]:text-sky-deep [&_a]:underline">
      {children}
    </div>
  );
}
