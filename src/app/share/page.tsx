import type { Metadata } from "next";
import { getAreas, getCity } from "@/lib/queries";
import { ShareForm } from "./ShareForm";
import { PHOTOS } from "@/lib/media";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Share" };

export default async function SharePage({ searchParams }: { searchParams: Promise<{ initiative?: string }> }) {
  const sp = await searchParams;
  const initiative = sp.initiative === "shelens" ? "shelens" : "yousee";
  const [city, areas] = await Promise.all([getCity(), getAreas()]);
  return (
    <>
      <PageHeader eyebrow={initiative === "shelens" ? "02 · Share · SheLens" : "02 · Share"} title="Share an experience of your city" tone={initiative === "shelens" ? "rose" : "butter"} photo={PHOTOS["flood-street"]}>
        It takes about two minutes. You don&apos;t need an account, and you choose how much to share. Every contribution is checked
        by a moderator before it appears publicly.
      </PageHeader>
      <ShareForm
        defaultInitiative={initiative}
        center={[city.centerLat, city.centerLng]}
        zoom={city.defaultZoom}
        areas={areas.map((a) => ({ id: a.id, name: a.name }))}
      />
    </>
  );
}
