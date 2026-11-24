"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, Polygon, useMapEvents, Tooltip } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  color: string;
  radius?: number;
  title: string;
  subtitle?: string;
  body?: string;
  dashed?: boolean;
  badge?: string;
};
export type AreaBubble = { id: string; name: string; lat: number; lng: number; count: number; label: string };

export function ExploreMap({
  center,
  zoom,
  points,
  bubbles,
  showBubbles,
  onSelect,
}: {
  center: LatLngTuple;
  zoom: number;
  points: MapPoint[];
  bubbles: AreaBubble[];
  showBubbles: boolean;
  onSelect?: (id: string) => void;
}) {
  const max = Math.max(1, ...bubbles.map((b) => b.count));
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full" style={{ minHeight: 420 }}>
      <TileLayer attribution={ATTR} url={TILES} />
      {showBubbles &&
        bubbles.map((b) => (
          <CircleMarker
            key={b.id}
            center={[b.lat, b.lng]}
            radius={b.count ? 10 + 22 * Math.sqrt(b.count / max) : 6}
            pathOptions={{ color: "#26384A", weight: 1, fillColor: b.count ? "#B9D7F2" : "#ffffff", fillOpacity: b.count ? 0.55 : 0.3, dashArray: b.count ? undefined : "3 3" }}
          >
            <Tooltip direction="top">
              <strong>{b.name}</strong>
              <br />
              {b.label}
            </Tooltip>
          </CircleMarker>
        ))}
      {!showBubbles &&
        points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={p.radius ?? 8}
            eventHandlers={{ click: () => onSelect?.(p.id) }}
            pathOptions={{ color: "#26384A", weight: 1.5, fillColor: p.color, fillOpacity: 0.85, dashArray: p.dashed ? "3 3" : undefined }}
          >
            <Popup>
              <div style={{ maxWidth: 240 }}>
                {p.badge && <div style={{ fontSize: 10, fontWeight: 700, color: "#8A5CC2", textTransform: "uppercase" }}>{p.badge}</div>}
                <strong>{p.title}</strong>
                {p.subtitle && <div style={{ fontSize: 12, color: "#4A5C6E" }}>{p.subtitle}</div>}
                {p.body && <p style={{ margin: "6px 0 0", fontSize: 12 }}>{p.body}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </MapContainer>
  );
}

function ClickCapture({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export function PickerMap({
  center,
  zoom,
  mode,
  vertices,
  onAdd,
}: {
  center: LatLngTuple;
  zoom: number;
  mode: "point" | "route" | "area";
  vertices: LatLngTuple[];
  onAdd: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full" style={{ minHeight: 300 }}>
      <TileLayer attribution={ATTR} url={TILES} />
      <ClickCapture onClick={onAdd} />
      {mode === "route" && vertices.length > 1 && <Polyline positions={vertices} pathOptions={{ color: "#C9567A", weight: 4 }} />}
      {mode === "area" && vertices.length > 2 && <Polygon positions={vertices} pathOptions={{ color: "#3D79B0", fillOpacity: 0.25 }} />}
      {vertices.map((v, i) => (
        <CircleMarker key={i} center={v} radius={mode === "point" ? 10 : 5} pathOptions={{ color: "#26384A", fillColor: "#F4B6C9", fillOpacity: 1 }} />
      ))}
    </MapContainer>
  );
}
