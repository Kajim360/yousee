import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * YouSee information model.
 * Principle: original citizen records, AI interpretations, human validation
 * and published insights are stored in SEPARATE tables so they can never be
 * confused with one another.
 */

export const initiatives = pgTable("initiatives", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cities = pgTable("cities", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  centerLat: doublePrecision("center_lat").notNull(),
  centerLng: doublePrecision("center_lng").notNull(),
  defaultZoom: integer("default_zoom").notNull().default(12),
});

/** Accounts. Participants may use credentials, phone OTP or OAuth; admins are issued credentials MANUALLY. */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    displayName: text("display_name").notNull(),
    email: text("email").unique(),
    phone: text("phone").unique(),
    passwordHash: text("password_hash"),
    provider: text("provider").notNull().default("credentials"), // credentials | phone | google | apple | facebook | manual
    providerSubject: text("provider_subject"),
    role: text("role").notNull().default("participant"), // participant | admin
    verified: boolean("verified").notNull().default(false),
    verificationNote: text("verification_note"),
    isDemoAdmin: boolean("is_demo_admin").notNull().default(false),
    publicProfile: boolean("public_profile").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_provider_subject_idx").on(t.provider, t.providerSubject)]
);

/** Short-lived phone verification codes. Only a hash is stored. */
export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Administrative areas (kecamatan). Centroids are APPROXIMATE, not official boundaries. */
export const areas = pgTable("areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  cityId: uuid("city_id").notNull().references(() => cities.id),
  name: text("name").notNull(),
  level: text("level").notNull().default("kecamatan"),
  centroidLat: doublePrecision("centroid_lat").notNull(),
  centroidLng: doublePrecision("centroid_lng").notNull(),
  geometryNote: text("geometry_note").notNull(),
});

/** Original citizen contributions. Never modified by AI. */
export const contributions = pgTable(
  "contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    initiativeId: uuid("initiative_id").references(() => initiatives.id),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    cityId: uuid("city_id").notNull().references(() => cities.id),
    areaId: uuid("area_id").references(() => areas.id),
    kind: text("kind").notNull(), // issue | experience | cognitive
    category: text("category").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    emotion: text("emotion"), // citizen-selected, optional
    emotionNote: text("emotion_note"),
    cognitiveType: text("cognitive_type"),
    observation: text("observation"), // physical observation, optional
    geometryType: text("geometry_type").notNull().default("none"), // point | route | area | none
    geometry: jsonb("geometry"), // raw GeoJSON geometry — restricted, admin only
    locationPrecision: text("location_precision").notNull().default("none"), // exact | approximate | area_only | none
    publicLat: doublePrecision("public_lat"), // privacy-reduced display coordinate
    publicLng: doublePrecision("public_lng"),
    participationMode: text("participation_mode").notNull().default("anonymous"),
    pseudonym: text("pseudonym"),
    ageRange: text("age_range"),
    genderIdentity: text("gender_identity"),
    privacyClass: text("privacy_class").notNull().default("public"), // public | restricted
    status: text("status").notNull().default("pending"), // pending | approved | rejected | flagged
    isSynthetic: boolean("is_synthetic").notNull().default(false),
    deleteTokenHash: text("delete_token_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("contrib_status_idx").on(t.status),
    index("contrib_area_idx").on(t.areaId),
    index("contrib_category_idx").on(t.category),
    index("contrib_latlng_idx").on(t.publicLat, t.publicLng),
  ]
);

export const contributionMedia = pgTable("contribution_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  contributionId: uuid("contribution_id")
    .notNull()
    .references(() => contributions.id, { onDelete: "cascade" }),
  mimeType: text("mime_type").notNull(),
  dataBase64: text("data_base64").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const consentRecords = pgTable("consent_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  contributionId: uuid("contribution_id")
    .notNull()
    .references(() => contributions.id, { onDelete: "cascade" }),
  consentVersion: text("consent_version").notNull(),
  publicDisplay: boolean("public_display").notNull(),
  researchUse: boolean("research_use").notNull(),
  demographicUse: boolean("demographic_use").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const moderationRecords = pgTable("moderation_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  contributionId: uuid("contribution_id").references(() => contributions.id, { onDelete: "set null" }),
  targetType: text("target_type").notNull().default("contribution"),
  targetId: text("target_id"),
  action: text("action").notNull(),
  note: text("note"),
  actor: text("actor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** AI outputs stored apart from original records, with model + prompt versions. */
export const aiInterpretations = pgTable("ai_interpretations", {
  id: uuid("id").primaryKey().defaultRandom(),
  contributionId: uuid("contribution_id").references(() => contributions.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // categorization | emotional_frame
  output: jsonb("output").notNull(),
  method: text("method").notNull(), // llm | heuristic
  model: text("model"),
  promptVersion: text("prompt_version").notNull(),
  reviewStatus: text("review_status").notNull().default("pending"), // pending | accepted | rejected
  reviewerNote: text("reviewer_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const evidenceSources = pgTable("evidence_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  publisher: text("publisher").notNull(),
  url: text("url").notNull(),
  sourceType: text("source_type").notNull(), // official | secondary | community | synthetic | ai
  description: text("description").notNull(),
  coverage: text("coverage").notNull(),
  spatialResolution: text("spatial_resolution"),
  license: text("license").notNull(),
  limitations: text("limitations").notNull(),
  dataQuality: text("data_quality").notNull(),
  processingHistory: text("processing_history").notNull(),
  collectedAt: text("collected_at"),
  lastChecked: text("last_checked").notNull(),
});

/** Retrieval corpus for Ask Your City. Each chunk keeps its source reference. */
export const knowledgeDocs = pgTable("knowledge_docs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceId: uuid("source_id").notNull().references(() => evidenceSources.id),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  body: text("body").notNull(),
});

export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  initiativeId: uuid("initiative_id").references(() => initiatives.id),
  areaId: uuid("area_id").references(() => areas.id),
  category: text("category"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  themes: jsonb("themes").notNull().default([]),
  emotionDistribution: jsonb("emotion_distribution").notNull().default({}),
  confidence: text("confidence").notNull(), // low | medium | high
  uncertaintyNote: text("uncertainty_note").notNull(),
  representationNote: text("representation_note").notNull(),
  method: text("method").notNull(),
  model: text("model"),
  promptVersion: text("prompt_version").notNull(),
  status: text("status").notNull().default("draft"), // draft | in_review | published | archived
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const insightContributions = pgTable(
  "insight_contributions",
  {
    insightId: uuid("insight_id").notNull().references(() => insights.id, { onDelete: "cascade" }),
    contributionId: uuid("contribution_id").notNull().references(() => contributions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.insightId, t.contributionId] })]
);

export const insightSources = pgTable(
  "insight_sources",
  {
    insightId: uuid("insight_id").notNull().references(() => insights.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").notNull().references(() => evidenceSources.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.insightId, t.sourceId] })]
);

export const validationRecords = pgTable("validation_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  insightId: uuid("insight_id").notNull().references(() => insights.id, { onDelete: "cascade" }),
  reviewerRole: text("reviewer_role").notNull(), // resident | facilitator | researcher | expert | moderator
  reviewerName: text("reviewer_name"),
  verdict: text("verdict").notNull(), // agree | partially | disagree
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  initiativeId: uuid("initiative_id").references(() => initiatives.id),
  areaId: uuid("area_id").references(() => areas.id),
  insightId: uuid("insight_id").references(() => insights.id, { onDelete: "set null" }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  authorPseudonym: text("author_pseudonym"),
  status: text("status").notNull().default("proposed"), // proposed | under_review | approved | funded | implemented | declined
  statusEvidenceUrl: text("status_evidence_url"),
  supportCount: integer("support_count").notNull().default(0),
  moderation: text("moderation").notNull().default("pending"), // pending | approved | rejected
  isSynthetic: boolean("is_synthetic").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const opportunities = pgTable("opportunities", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // service | education | employment | community | information
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  geographicScope: text("geographic_scope").notNull(),
  lastVerified: text("last_verified").notNull(),
  verificationNote: text("verification_note").notNull(),
});

/** Participant-submitted climate-justice, policy or environmental actions awaiting admin review. */
export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // climate_justice | policy | environment | community
  title: text("title").notNull(),
  description: text("description").notNull(),
  evidenceUrl: text("evidence_url"),
  status: text("status").notNull().default("pending"), // pending | approved | declined
  reviewedBy: text("reviewed_by"),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Every point and kudos has a source; nothing is invented. */
export const rewards = pgTable("rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // incident | activity | kudos | validation
  title: text("title").notNull(),
  description: text("description"),
  points: integer("points").notNull(),
  sourceType: text("source_type").notNull(), // contribution | activity | manual | validation
  sourceId: text("source_id"),
  awardedBy: text("awarded_by").notNull(), // moderator name or "system"
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Admin-authored blog posts, articles and announcements. */
export const contentPosts = pgTable("content_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // blog | article | announcement
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  coverKey: text("cover_key"),
  status: text("status").notNull().default("draft"), // draft | published | archived
  pinned: boolean("pinned").notNull().default(false),
  authorName: text("author_name").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** AI evaluation log for Ask Your City. */
export const askLogs = pgTable("ask_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sources: jsonb("sources").notNull().default([]),
  method: text("method").notNull(),
  model: text("model"),
  promptVersion: text("prompt_version").notNull(),
  evidenceSufficient: boolean("evidence_sufficient").notNull(),
  helpful: boolean("helpful"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
