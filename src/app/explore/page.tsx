import type { Metadata } from "next";
import { getAreas, getCity, getPublicContributions, getSources } from "@/lib/queries";
import { Explorer } from "./Explorer";
import { PHOTOS } from "@/lib/media";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Explore" };

export default async function ExplorePage() {
  const [city, areas, items, sources] = await Promise.all([getCity(), getAreas(), getPublicContributions(), getSources()]);
  return (
    <>
      <PageHeader eyebrow="01 · Explore" title={`Experiences of ${city.name}`} tone="sky" photo={PHOTOS["city-baguio"]}>
        Approved, consented contributions shown at privacy-reduced locations. The map shows where people chose to share, not where
        problems are most common.
      </PageHeader>
      <Explorer
        center={[city.centerLat, city.centerLng]}
        zoom={city.defaultZoom}
        items={items}
        areas={areas.map((a) => ({ id: a.id, name: a.name, lat: a.centroidLat, lng: a.centroidLng }))}
        sources={sources.filter((s) => s.sourceType === "official").map((s) => ({ name: s.name, url: s.url, limitations: s.limitations }))}
      />
    </>
  );
}
