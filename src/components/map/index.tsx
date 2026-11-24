"use client";
import dynamic from "next/dynamic";

const Loading = () => (
  <div className="grid h-full min-h-[300px] w-full place-items-center rounded-2xl bg-sky/30 text-sm text-ink-soft">Loading map…</div>
);

export const ExploreMap = dynamic(() => import("./LeafletMaps").then((m) => m.ExploreMap), { ssr: false, loading: Loading });
export const PickerMap = dynamic(() => import("./LeafletMaps").then((m) => m.PickerMap), { ssr: false, loading: Loading });
export type { MapPoint, AreaBubble } from "./LeafletMaps";
