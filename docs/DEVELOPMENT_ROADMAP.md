# Development Roadmap

| Milestone | Deliverables | Acceptance criteria | Status |
|---|---|---|---|
| M0 Audit | repo audit, gap analysis, plan | documented in README + PRODUCT_REQUIREMENTS | ✅ |
| M1 Foundation | IA, design system, nav, homepage, YouSee/SheLens pages | all primary and secondary pages render, responsive | ✅ |
| M2 UX | Explore, Share, filters, empty/error states | contribution submitted end-to-end; filters work | ✅ |
| M3 Backend | schema, consent, moderation, uploads, deletion | records traceable; deletion cascades; audit log | ✅ (push, not migrations) |
| M4 Geospatial | map, location picker, point/route/area, precision controls | raw geometry never public | 🟡 official boundaries + PostGIS pending |
| M5 Collective intelligence | categorisation, aggregation, insights, validation, publication gate | insight links to records + sources; publish blocked without validation | ✅ |
| M6 AI | Ask Your City, RAG, logging, evaluation view | cites sources; says when evidence is insufficient | ✅ 🔑 (needs API key for LLM mode) |
| M7 QA | functional, accessibility, security, AI eval set | see TESTING_STRATEGY | 🟡 smoke tests only |
| M8 Production | Supabase/Vercel, domain, env, monitoring | deployment checklist complete | ❌ |

## Recommended next steps
1. Bahasa Indonesia UI translation (most important for real participation).
2. Import official kecamatan boundaries and switch to PostGIS point-in-polygon.
3. Supabase Auth with roles; set production secrets.
4. Facilitated offline sessions plus a printable form to reach residents with limited digital access.
5. Build the AI evaluation test set; measure baselines.
6. Ingest BPS kecamatan indicators and RTRW text into the RAG corpus.

## Expected costs (estimates)
Vercel Hobby/Pro $0–20/mo · Supabase Free/Pro $0–25/mo · Claude API is usage-based, likely < $20/mo at pilot volume (only short prompts) · domain ~$15/yr.


## 0.2.0 status
M0-M6 remain as before. New: M9 (accounts and recognition) and M10 (editorial publishing) are implemented with the limitations above: OAuth/Twilio need real provider credentials; admin accounts need manual issuance; Bahasa Indonesia UI and official boundaries remain outstanding.
