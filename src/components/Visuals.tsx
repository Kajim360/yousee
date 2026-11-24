import Link from "next/link";
import type { ReactNode } from "react";
import { PHOTO_DISCLOSURE, getPhoto, type Photo } from "@/lib/media";

/** One photograph with its caption, credit and the mandatory disclosure. */
export function PhotoFrame({ photo, className = "", ratio = "aspect-[16/10]", compact = false }: { photo: Photo; className?: string; ratio?: string; compact?: boolean }) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-ink/10 bg-softwhite ${className}`}>
      <div className={`relative ${ratio} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-softwhite backdrop-blur">
          {photo.subject}
        </span>
      </div>
      <figcaption className="px-4 py-3">
        <p className="font-display text-sm font-bold">{photo.caption}</p>
        <p className="mt-0.5 text-xs text-ink-soft">Photo: {photo.credit}</p>
        {!compact && <p className="mt-1.5 text-[11px] leading-snug text-ink-soft/80">{PHOTO_DISCLOSURE}</p>}
      </figcaption>
    </figure>
  );
}

/** Emotional three-part photo essay. Used on the homepage to lead people into Share, Understand and Create Possibilities. */
export function PhotoEssay() {
  const items: { key: string; eyebrow: string; title: string; text: string; href: string; cta: string }[] = [
    {
      key: "flood-street",
      eyebrow: "What people live through",
      title: "The street is where climate change is felt first.",
      text: "A route to school, a market stall, a doorway. Share the experience that official datasets rarely record.",
      href: "/share",
      cta: "Share an experience",
    },
    {
      key: "community-dialogue",
      eyebrow: "What we learn together",
      title: "One voice becomes a pattern when it is heard with others.",
      text: "Insights stay connected to the original words, with uncertainty and disagreement kept visible.",
      href: "/understand",
      cta: "See collective insights",
    },
    {
      key: "community-tree-planting",
      eyebrow: "What we can do next",
      title: "Understanding should open possibilities, not close them.",
      text: "Community proposals and recognised local action turn shared evidence into civic conversation.",
      href: "/possibilities",
      cta: "Explore possibilities",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">In pictures · regional context</p>
          <h2 className="mt-2 text-3xl font-bold">From everyday experience to collective action</h2>
        </div>
        <p className="max-w-sm text-sm text-ink-soft">These photographs show regional city life, flooding, community engagement and environmental care. They set the emotional context; they are not data.</p>
      </div>
      <div className="mt-7 grid gap-5 md:grid-cols-3">
        {items.map((it) => {
          const photo = getPhoto(it.key)!;
          return (
            <article key={it.key} className="group overflow-hidden rounded-2xl border border-ink/10 bg-softwhite">
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-5">
                <p className="eyebrow">{it.eyebrow}</p>
                <h3 className="mt-2 font-display text-xl font-bold leading-snug">{it.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{it.text}</p>
                <Link href={it.href} className="mt-4 inline-block text-sm font-semibold text-rose-deep underline">{it.cta}</Link>
                <p className="mt-3 text-[11px] text-ink-soft/80">Photo: {photo.credit}</p>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-ink-soft">{PHOTO_DISCLOSURE}</p>
    </section>
  );
}

/** Full-width editorial band used between long sections for breathing room. */
export function PhotoBand({ photoKey, eyebrow, title, children, action }: { photoKey: string; eyebrow: string; title: string; children?: ReactNode; action?: { href: string; label: string } }) {
  const photo = getPhoto(photoKey);
  if (!photo) return null;
  return (
    <section className="relative isolate overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.src} alt={photo.alt} className="absolute inset-0 -z-10 h-full w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/95 via-ink/80 to-ink/30" />
      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
        <div className="max-w-2xl text-softwhite">
          <p className="eyebrow !text-butter">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h2>
          {children && <div className="mt-4 text-softwhite/85">{children}</div>}
          {action && <Link href={action.href} className="btn-rose mt-6">{action.label}</Link>}
        </div>
      </div>
      <div className="bg-ink/85 px-4 py-2 text-center text-[11px] text-softwhite/70">
        Photo: {photo.credit} · {PHOTO_DISCLOSURE}
      </div>
    </section>
  );
}
