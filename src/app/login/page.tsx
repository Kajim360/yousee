import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user-auth";
import { PHOTOS, PHOTO_DISCLOSURE } from "@/lib/media";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string; provider?: string; next?: string }> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (user && !sp.notice) redirect(sp.next?.startsWith("/") ? sp.next : "/account");
  const photo = PHOTOS["city-manila"];
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-2">
      <div className="px-4 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-md">
          <p className="eyebrow">Your account</p>
          <h1 className="mt-2 text-3xl font-bold">Take part, and be recognised</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Log in to report incidents, submit climate-justice and environmental actions, and receive kudos from moderators.
            Reporting anonymously is still available on the Share page with no account at all.
          </p>
          <LoginClient notice={sp.notice} provider={sp.provider} />
          <div className="mt-8 rounded-xl border border-ink/15 bg-softwhite p-4 text-sm">
            <p className="font-semibold">Administrator access</p>
            <p className="mt-1 text-ink-soft">Admin accounts are issued and verified manually by the system operator. Social login is never used for administrators.</p>
            <a href="/admin" className="mt-2 inline-block font-semibold text-rose-deep underline">Go to admin sign-in</a>
          </div>
        </div>
      </div>
      <div className="relative hidden min-h-full lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.src} alt={photo.alt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-10 text-softwhite">
          <p className="eyebrow !text-butter">Cities learn from people</p>
          <h2 className="mt-2 max-w-md text-3xl font-bold leading-tight">Your experience of a place can help a city understand itself.</h2>
          <p className="mt-3 text-sm text-softwhite/80">Photo: {photo.credit}</p>
          <p className="mt-1 text-xs text-softwhite/60">{PHOTO_DISCLOSURE}</p>
        </div>
      </div>
    </div>
  );
}
