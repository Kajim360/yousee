import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts } from "@/lib/queries";
import { PHOTOS, getPhoto, PHOTO_DISCLOSURE } from "@/lib/media";
import { EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Updates, articles & announcements" };

const KINDS: Record<string, string> = { announcement: "Announcement", article: "Article", blog: "Blog post" };

export default async function UpdatesPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const sp = await searchParams;
  const posts = await getPublishedPosts(sp.kind);
  return (
    <>
      <PageHeader eyebrow="From the YouSee team" title="Updates, articles & announcements" tone="sky" photo={PHOTOS["city-night"]}>
        Writing from verified administrators only. Every post names its author and publication date.
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          <Link href="/updates" className={`chip border border-ink/15 ${!sp.kind ? "bg-ink text-softwhite" : "bg-softwhite"}`}>All</Link>
          {Object.entries(KINDS).map(([k, label]) => (
            <Link key={k} href={`/updates?kind=${k}`} className={`chip border border-ink/15 ${sp.kind === k ? "bg-ink text-softwhite" : "bg-softwhite"}`}>{label}</Link>
          ))}
        </div>
        {posts.length === 0 ? (
          <div className="mt-6"><EmptyState title="Nothing published yet">Administrators publish blog posts, articles and announcements from the moderation dashboard.</EmptyState></div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {posts.map((p) => {
              const photo = getPhoto(p.coverKey);
              return (
                <Link key={p.id} href={`/updates/${p.id}`} className="card overflow-hidden !p-0 hover:border-ink/30">
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.src} alt={photo.alt} className="aspect-[16/9] w-full object-cover" loading="lazy" />
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2"><span className="chip bg-butter">{KINDS[p.kind]}</span>{p.pinned && <span className="chip bg-rose/60">Pinned</span>}</div>
                    <h2 className="mt-3 font-display text-xl font-bold">{p.title}</h2>
                    <p className="mt-2 text-sm text-ink-soft">{p.excerpt}</p>
                    <p className="mt-3 text-xs text-ink-soft">{p.authorName} · {p.publishedAt?.toLocaleDateString()}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {posts.some((p) => p.coverKey) && <p className="mt-5 text-xs text-ink-soft">{PHOTO_DISCLOSURE}</p>}
      </div>
    </>
  );
}
