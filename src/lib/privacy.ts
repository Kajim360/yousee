import { createHash, randomBytes } from "crypto";

type AreaLike = { id: string; centroidLat: number; centroidLng: number };

/**
 * Privacy-reduced public coordinate. Raw geometry is never exposed publicly.
 * exact becomes rounded to 3 decimals (~110 m); approximate becomes 2 decimals (~1.1 km);
 * area_only becomes district centroid; none becomes null.
 */
export function publicCoordinate(
  precision: string,
  lat: number | null,
  lng: number | null,
  area: AreaLike | null
): { lat: number; lng: number } | null {
  if (precision === "none") return null;
  if (precision === "area_only") return area ? { lat: area.centroidLat, lng: area.centroidLng } : null;
  if (lat == null || lng == null) return area ? { lat: area.centroidLat, lng: area.centroidLng } : null;
  const d = precision === "exact" ? 1000 : 100;
  return { lat: Math.round(lat * d) / d, lng: Math.round(lng * d) / d };
}

/** Nearest approximate centroid — a documented MVP approximation, not a point-in-polygon test. */
export function nearestArea<T extends AreaLike>(lat: number, lng: number, list: T[]): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const a of list) {
    const d = (a.centroidLat - lat) ** 2 + (a.centroidLng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  // ~0.08 deg ≈ 9 km — beyond that, the point is likely outside the city
  return bestD < 0.08 ** 2 ? best : null;
}

export function newDeleteToken() {
  const token = randomBytes(18).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Strip obvious personal identifiers from text shown in AI prompts / public summaries. */
export function redactPII(text: string) {
  return text
    .replace(/(\+62|62|0)8[0-9\s-]{7,13}/g, "[phone removed]")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email removed]")
    .replace(/\b\d{16}\b/g, "[ID removed]");
}
