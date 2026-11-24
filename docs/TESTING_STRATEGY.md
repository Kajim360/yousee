# Testing Strategy

## Performed in this milestone
- `next typegen`, `tsc --noEmit`, `next build`: pass.
- Runtime smoke test against a production build: all 15 pages and `/api/health` return 200.
- `POST /api/contributions` with a phone number + SheLens + unsafe + exact location → stored as `flagged`, precision reduced to `approximate`, district resolved (Teluk Betung Selatan), heuristic AI interpretation stored separately.
- `POST /api/ask`: flooding “why” question returns methodology/BMKG passages, not invented causes; district question returns labelled synthetic records.
- `DELETE /api/contributions/[id]` with token → deleted.

## Not yet automated (to add)
- Unit tests: `publicCoordinate`, `nearestArea`, `redactPII`, `scoreChunks` (Vitest).
- Integration: insight generation → validation → publish gate; proposal evidence gate.
- E2E (Playwright): share flow on mobile viewport; admin moderation.
- Accessibility: axe scan; keyboard-only map alternative (district select exists).
- AI eval set: 30 bilingual questions with expected sources; hallucination and attribution scoring.
- Load: 100 concurrent map loads; contribution POST latency.


## 0.2.0 checks
`node scripts/check-no-glyphs.mjs` passes (no icon/emoji glyphs in 62 UI source files). Runtime smoke test needed for: register/login, phone OTP demo flow, OAuth unconfigured notice, activity submission, admin credential login, post publish, kudos, recognition board.
