# Database Schema (src/db/schema.ts)

| Table | Purpose | Key relations |
|---|---|---|
| `initiatives` | YouSee Open City, SheLens, future initiatives | — |
| `cities` | pilot cities (Bandar Lampung) | — |
| `areas` | 20 kecamatan with **approximate** centroids | → cities |
| `contributions` | original citizen records, never modified by AI | → initiatives, cities, areas |
| `contribution_media` | optional photo (EXIF stripped client-side) | → contributions (cascade) |
| `consent_records` | versioned consent: public / research / demographic | → contributions (cascade) |
| `moderation_records` | audit trail of all moderator and contributor actions | → contributions (set null) |
| `ai_interpretations` | AI or heuristic suggestions with method, model, prompt version, review status | → contributions (cascade) |
| `evidence_sources` | documented sources: type, coverage, licence, limitations, processing history | — |
| `knowledge_docs` | retrieval corpus chunks, each tied to a source | → evidence_sources |
| `insights` | drafted/reviewed/published collective insights with confidence, uncertainty and representation notes | → initiatives, areas |
| `insight_contributions` | which records support an insight | → insights, contributions |
| `insight_sources` | which sources support an insight | → insights, evidence_sources |
| `validation_records` | community and expert review responses | → insights |
| `proposals` | community proposals, evidence-gated status | → initiatives, areas, insights |
| `opportunities` | verified services, information and programmes | — |
| `ask_logs` | Ask Your City evaluation log | — |

## Privacy-relevant columns
- `contributions.geometry`: raw GeoJSON, **admin only**. `public_lat/lng` hold the reduced coordinate.
- `age_range`, `gender_identity`: stored only when `consent_records.demographic_use = true`.
- `delete_token_hash`: SHA-256 of the contributor's private token. The token itself is never stored.
- `is_synthetic`: marks demo data.

## Indexes
status, area, category, (public_lat, public_lng). Planned: GiST on PostGIS geography.

## Migrations
MVP uses `npx drizzle-kit push`. Before production, switch to `drizzle-kit generate` and commit SQL migrations.


## 0.2.0 additions
`users`, `otp_codes`, `activities`, `rewards`, `content_posts`; `contributions.user_id` and `proposals.user_id` added. Unique index on `(provider, provider_subject)`. Run `npx drizzle-kit push` after pulling these changes.
