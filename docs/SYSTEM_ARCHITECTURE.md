# System Architecture

```
Browser (Next.js client components: Explorer, ShareForm, AskYourCity, map)
   │  fetch / server actions
Next.js App Router (server components + route handlers + server actions)
   ├─ src/lib/queries.ts   public data access (approved + consented + privacy-reduced only)
   ├─ src/lib/privacy.ts   coordinate reduction, nearest district, PII redaction, delete tokens
   ├─ src/lib/ai.ts        Claude calls (server-only), Zod-validated outputs, heuristic fallbacks, retrieval scoring
   ├─ src/lib/seed.ts      idempotent seed (advisory lock) of city, districts, sources, docs, synthetic demo
   ├─ src/lib/auth.ts      moderator HMAC cookie session
   └─ src/app/admin/actions.ts  moderation, insight pipeline, publication gate, audit
PostgreSQL (Drizzle ORM)
External: OpenStreetMap tiles (browser) · Anthropic API (server, optional)
```

## Key decisions
- **Kept Next.js + Drizzle + Postgres** instead of migrating to Supabase now. Supabase is Postgres underneath, so the schema moves as-is. Auth/Storage/RLS can be adopted in Milestone 5.
- **No PostGIS yet:** the local DB does not guarantee the extension. Geometry is stored as GeoJSON `jsonb`; district assignment uses nearest approximate centroid. Migration path: add a `geography` column with a GiST index and `ST_Contains` against official polygons.
- **Photos in DB (base64, ≤ ~1.5 MB after browser resize):** avoids configuring object storage for the MVP. Move to Supabase Storage or S3 for production.
- **Keyword retrieval instead of embeddings:** the corpus has fewer than 100 documents, so lexical scoring is transparent and adequate. Add pgvector when the corpus grows (RTRW/RPJMD ingestion).
- **Server actions for admin** keep moderator operations off the public API surface.

## Directory map
- `src/app/*`: pages: home, explore, share, understand(/[id]), connect, possibilities, shelens, about, methodology, data, guidelines, privacy, me, admin
- `src/app/api/*`: contributions, contributions/[id], media/[id], ask, ask/[id]/feedback, insights/[id]/validate, proposals, health
- `src/components/*`: SiteNav, ui primitives (provenance LayerTag etc.), map (Leaflet, client-only)
- `src/db/schema.ts`: information model


## 0.2.0 additions
`src/lib/user-auth.ts` (signed user sessions), `src/lib/password.ts` (scrypt / OTP hashing), `src/lib/oauth.ts` (Google / Apple / Facebook), `src/lib/media.ts` (photo registry), `src/components/Visuals.tsx` (photo essay, frame, band). Admin server actions split between `actions.ts` and `community-actions.ts`. New pages: `/login`, `/account`, `/recognition`, `/updates`, `/updates/[id]`.
