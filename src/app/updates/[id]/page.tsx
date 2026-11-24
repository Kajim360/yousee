import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/queries";
import { getPhoto, PHOTO_DISCLOSURE } from "@/lib/media";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "YouSee update" };

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const p = await getPost(id);
  if (!p || p.status !== "published") notFound();
  const photo = getPhoto(p.coverKey);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/updates" className="text-sm underline">All updates</Link>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="chip bg-butter">{p.kind}</span>
        {p.pinned && <span className="chip bg-rose/60">Pinned</span>}
      </div>
      <h1 className="mt-3 text-3xl font-bold md:text-4xl">{p.title}</h1>
      <p className="mt-2 text-sm text-ink-soft">By {p.authorName} · published {p.publishedAt?.toLocaleDateString()}</p>
      {photo && (
        <figure className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt} className="aspect-[16/9] w-full rounded-2xl object-cover" />
          <figcaption className="mt-2 text-xs text-ink-soft">Photo: {photo.credit} · {PHOTO_DISCLOSURE}</figcaption>
        </figure>
      )}
      <p className="mt-6 text-lg font-semibold text-ink-soft">{p.excerpt}</p>
      <div className="mt-6 whitespace-pre-line leading-relaxed">{p.body}</div>
      <div className="mt-10 rounded-xl border border-ink/10 bg-softwhite p-4 text-sm text-ink-soft">
        Posts are written by manually verified YouSee administrators. They are editorial content, not evidence about any contribution or place.
      </div>
    </div>
  );
}
