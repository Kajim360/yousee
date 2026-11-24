# Changelog

## 0.1.0 — MVP foundation (M0–M6)
- Repository audit and gap analysis.
- Information model (17 tables) with separation of citizen records, AI outputs, validation and insights.
- Pages: home, explore, share, understand (+detail), connect, possibilities, shelens, about, methodology, data, guidelines, privacy, me, admin.
- Leaflet map with privacy-reduced points; point/route/area picker.
- Consent v`2026-01-v1`; PII auto-flag; self-deletion tokens; audit log.
- AI: categorisation + exploratory frame suggestion, insight drafting, Ask Your City RAG, with heuristic fallbacks; prompt versions categorize-v1, insight-v1, ask-v1.
- Publication gate: insights need at least one validation response. Proposal statuses beyond “Proposed” need an evidence URL.
- Seed: 20 kecamatan (approximate), 8 documented sources, 9 knowledge docs, 6 verified resources, 18 synthetic contributions, 1 synthetic proposal.


## 0.2.0 — Photography, accounts, rewards and admin publishing
- Removed all emoji / sparkle / star / pin glyphs from the UI; replaced with CSS colour dots and text badges. Added `scripts/check-no-glyphs.mjs` as an enforceable design rule.
- Added 11 credited Pexels photographs, a documented registry and systematic placement across the homepage and all major pages, each with an illustrative-photography disclosure.
- Added participant accounts (email/password, phone OTP, Google/Apple/Facebook OAuth with honest unconfigured states), account dashboard, recognition points and kudos, activity submissions and a public recognition board.
- Added manually issued, verified admin credentials with a CLI script, admin-authored blog posts / articles / announcements and a public Updates section.
