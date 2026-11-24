# Product Requirements & Gap Analysis

Legend: ✅ implemented · 🟡 partial · ❌ not implemented · 🔑 needs external configuration · ❓ needs product clarification

## Starting point (Phase 0)
| Area | Found |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript, Tailwind v4 |
| Backend/DB | PostgreSQL via Drizzle ORM (empty schema) |
| Pages | placeholder home, `/api/health` |
| Integrations, design system, data | none |
| Deployment | platform-managed build and start |

## Priority 1 — Essential
| Requirement | Status | Notes |
|---|---|---|
| YouSee identity, palette, typography | ✅ | Rose/Sky/Butter/Ink/Ivory/Soft White; Chakra Petch + Plus Jakarta Sans |
| Responsive homepage | ✅ | Live stats exclude synthetic data |
| Explore + interactive Bandar Lampung map | ✅ | Leaflet/OSM, filters, emotion layer, district aggregation |
| Share + working contribution form | ✅ | 3 steps, anonymous/pseudonymous, optional photo |
| Structured contribution DB | ✅ | see DATABASE_SCHEMA.md |
| Basic spatial model | 🟡 | GeoJSON point/route/polygon; nearest approximate centroid, no PostGIS yet |
| SheLens pathway | ✅ | `/shelens`, `/share?initiative=shelens`, safer defaults |
| Admin moderation | ✅ | queue, flags, audit log |
| Privacy & consent | ✅ | versioned consent records, precision reduction, self-deletion |

## Priority 2 — Core intelligence
| Requirement | Status | Notes |
|---|---|---|
| Categorisation | ✅ 🔑 | Claude if key set, otherwise keyword heuristic |
| Emotional mapping | ✅ | user emotions + separate exploratory frame (AI-suggested, reviewable) |
| Cognitive mapping | ✅ | 8 types, points/routes/areas |
| Spatial aggregation | ✅ | per-district counts, coverage gaps |
| AI summaries | ✅ 🔑 | LLM or extractive fallback |
| Source-linked insights | ✅ | records + evidence sources linked |
| Human validation workflow | ✅ | publish blocked without validation |

## Priority 3 — Extended
| Requirement | Status | Notes |
|---|---|---|
| Ask Your City / Civic Assistant | ✅ 🔑 | keyword RAG with citations, sufficiency check, logging |
| RAG knowledge base | 🟡 | 9 curated documents; no embeddings yet (not justified at this corpus size) |
| Opportunity recommendations | 🟡 | 6 verified national/city links; not personalised |
| Community proposals | ✅ | evidence-gated status ladder |
| Institutional views | ❌ | later layer by design |

## Priority 4 — Future
Multi-city 🟡 (schema has `cities`, `initiatives`), other items ❌.

## Requires external configuration
`ANTHROPIC_API_KEY`, `ADMIN_PASSCODE`, `SESSION_SECRET`, official boundary GeoJSON, BPS/BMKG datasets, production domain.

## Requires product clarification ❓
1. Who serves as community validators in the pilot (facilitator network, partner NGOs, universities)?
2. Pilot languages: Bahasa Indonesia UI translation is needed. Should Bahasa Lampung be supported?
3. Data retention period for pilot research (proposed: pilot duration + 12 months).
4. Whether institutional stakeholders will be formally engaged in phase 1.
