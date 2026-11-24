// Shared domain vocabulary for YouSee. Safe to import in client and server code.
// DESIGN RULE: no glyph icons, emoji or icon-font characters anywhere in the UI.
// Visual meaning is carried by words, typography, small CSS dots and colour blocks.

export const CATEGORIES = [
  { id: "flooding", label: "Flooding & drainage", short: "FL", tone: "#B9D7F2" },
  { id: "mobility", label: "Mobility & transport", short: "MO", tone: "#F8E4A8" },
  { id: "public_space", label: "Public spaces & facilities", short: "PS", tone: "#F4B6C9" },
  { id: "accessibility", label: "Accessibility", short: "AC", tone: "#D6C7EF" },
  { id: "safety_comfort", label: "Safety & comfort", short: "SA", tone: "#F2C7A8" },
  { id: "weather_env", label: "Extreme weather & environment", short: "WE", tone: "#CBE4B8" },
  { id: "services", label: "Education, health & public services", short: "SE", tone: "#B9D7F2" },
  { id: "waste", label: "Waste & sanitation", short: "WA", tone: "#E6D8C3" },
  { id: "place_identity", label: "Place identity & memory", short: "PI", tone: "#F4B6C9" },
  { id: "other", label: "Other", short: "OT", tone: "#E5E7EB" },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const categoryLabel = (id: string | null | undefined) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id ?? "—";
export const categoryShort = (id: string | null | undefined) => CATEGORIES.find((c) => c.id === id)?.short ?? "OT";
export const categoryTone = (id: string | null | undefined) => CATEGORIES.find((c) => c.id === id)?.tone ?? "#E5E7EB";

/** User-facing emotions — simple, optional, never forced. */
export const EMOTIONS = [
  { id: "happy", label: "Happy", color: "#F8C64A" },
  { id: "calm", label: "Calm", color: "#7FB3E0" },
  { id: "neutral", label: "Neutral", color: "#A3A9B3" },
  { id: "frustrated", label: "Frustrated", color: "#E8795A" },
  { id: "sad", label: "Sad", color: "#6C8EBF" },
  { id: "unsafe", label: "Unsafe", color: "#D4507A" },
  { id: "other", label: "Other / Not sure", color: "#8C7AA8" },
] as const;
export const emotionMeta = (id: string | null | undefined) => EMOTIONS.find((e) => e.id === id);

/**
 * Analytical (exploratory) frame. NOT a clinical or validated classification.
 * Never auto-equated with a user's selected emotion; AI may only SUGGEST,
 * and suggestions remain reviewable.
 */
export const ANALYTICAL_FRAMES = [
  { id: "open", label: "Open", color: "#2E9E5B", gloss: "Receptive, comfortable engagement with the place." },
  { id: "fight", label: "Fight", color: "#D64545", gloss: "Resistance or contestation; the place provokes friction." },
  { id: "flight", label: "Flight", color: "#E3B505", gloss: "Avoidance; desire to leave or bypass the place." },
  { id: "freeze", label: "Freeze", color: "#3B7DD8", gloss: "Stuck or immobilised; reduced agency in the place." },
  { id: "fawn", label: "Fawn", color: "#EE8434", gloss: "Accommodation; adapting oneself to cope with the place." },
  { id: "unknown", label: "Unknown", color: "#8A5CC2", gloss: "Insufficient information to suggest any interpretation." },
] as const;

export const COGNITIVE_TYPES = [
  { id: "important", label: "A place that feels important" },
  { id: "frequent", label: "A place I visit often" },
  { id: "avoid", label: "An area I avoid" },
  { id: "memory", label: "A place tied to a memory" },
  { id: "route", label: "An important route" },
  { id: "disconnected", label: "An area that feels disconnected" },
  { id: "difficulty", label: "A place where I face difficulty" },
  { id: "improve", label: "A place that should be improved" },
] as const;
export const cognitiveLabel = (id: string | null | undefined) =>
  COGNITIVE_TYPES.find((c) => c.id === id)?.label ?? id ?? "—";

export const KINDS = [
  { id: "issue", label: "Report an urban issue" },
  { id: "experience", label: "Describe an everyday experience" },
  { id: "cognitive", label: "Map how I see a place" },
] as const;

export const LOCATION_PRECISION = [
  { id: "exact", label: "Show near the point (rounded to ~100 m)" },
  { id: "approximate", label: "Show approximately (~1 km)" },
  { id: "area_only", label: "Show only the district (kecamatan)" },
  { id: "none", label: "Don't share a location" },
] as const;

export const PROPOSAL_STATUSES = [
  { id: "proposed", label: "Proposed", tone: "bg-sky/60", needsEvidence: false },
  { id: "under_review", label: "Under review", tone: "bg-butter", needsEvidence: true },
  { id: "approved", label: "Approved", tone: "bg-emerald-100", needsEvidence: true },
  { id: "funded", label: "Funded", tone: "bg-emerald-200", needsEvidence: true },
  { id: "implemented", label: "Implemented", tone: "bg-emerald-300", needsEvidence: true },
  { id: "declined", label: "Declined", tone: "bg-rose/60", needsEvidence: true },
] as const;

export const ACTIVITY_KINDS = [
  { id: "climate_justice", label: "Climate justice advocacy", points: 30 },
  { id: "policy", label: "Policy participation", points: 30 },
  { id: "environment", label: "Environmental activity", points: 25 },
  { id: "community", label: "Community organising", points: 20 },
] as const;

export const CONSENT_VERSION = "2026-01-v1";

export const AGE_RANGES = ["<18", "18-24", "25-34", "35-44", "45-59", "60+", "prefer_not"] as const;
