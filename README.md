# YouSee — Human-Centered Urban Intelligence Platform

Pilot city: **Bandar Lampung, Indonesia** · Flagship initiative: **SheLens**

YouSee connects lived experiences, places, public evidence and reviewable AI so cities can learn from their people.
The MVP demonstrates the full core loop:

> A person shares an experience → it is connected to a place (privacy-reduced) → context and sources are attached →
> AI/heuristics suggest patterns (stored separately) → moderators and residents review → an insight is published with
> links back to the original records.

## Quick start

```bash
npm install
# .env must contain DATABASE_URL (PostgreSQL)
npx drizzle-kit push      # create tables
npm run dev               # seed data is inserted automatically on first request
```

Optional environment variables (server-side only, never exposed to the browser):

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | required |
| `ANTHROPIC_API_KEY` | Enables Claude for categorisation, insight drafts and Ask Your City | unset → transparent heuristic / retrieval-only fallbacks |
| `ANTHROPIC_MODEL` | Claude model id | `claude-sonnet-4-5` |
| `ADMIN_PASSCODE` | Moderator passcode | `yousee-demo-admin` (**demo only**) |
| `SESSION_SECRET` | HMAC secret for all signed sessions | derived from passcode |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in | unset (button explains setup) |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Apple sign-in | unset (button explains setup) |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Facebook sign-in | unset (button explains setup) |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Real phone SMS codes | unset (preview shows the code locally) |
| `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` | First verified admin account | preview bootstrap account |
| `NEXT_PUBLIC_SITE_URL` | OAuth callback base URL | request origin |

## Walkthrough of the core workflow
1. **Share** (`/share` or `/share?initiative=shelens`): submit an experience. It is stored as `pending` and an AI suggestion is stored in `ai_interpretations`.
2. **Moderate** (`/admin`, passcode above): approve or reject it, then accept or reject the AI suggestion.
3. **Insights tab**: generate a draft insight (topic, district, initiative). Edit the text and send it to community review.
4. **Understand** (`/understand/[id]`): residents submit validation responses (agree / partly / disagree).
5. **Admin**: publish. This is blocked until at least one validation response exists.
6. **Ask Your City** (`/connect`): questions are answered from documented sources, approved contributions and published insights, with citations and logging.
7. **Create Possibilities** (`/possibilities`): proposals; any status beyond “Proposed” requires a public evidence URL.

## Phase 0 audit (summary)
The repository was an empty Next.js 16 + Drizzle + PostgreSQL starter (only a health route and a placeholder page). There was
no prior YouSee code, design system, data or integrations. Decision: **keep the existing stack** (Postgres is the same engine
Supabase uses, so migration is straightforward) and add Leaflet, Recharts and Zod. See `docs/PRODUCT_REQUIREMENTS.md` for the full gap analysis
and `docs/DEVELOPMENT_ROADMAP.md` for milestones.

## Documentation
All in `docs/`: PRODUCT_OVERVIEW, PRODUCT_REQUIREMENTS (incl. gap analysis), SYSTEM_ARCHITECTURE, DATABASE_SCHEMA,
AI_METHODOLOGY, EMOTIONAL_MAPPING_FRAMEWORK, DATA_SOURCES, PRIVACY_AND_SECURITY, DEVELOPMENT_ROADMAP, TESTING_STRATEGY,
DEPLOYMENT_GUIDE, CHANGELOG, DECISIONS (product/technical decisions, risks, open questions).

**Notion sync:** no Notion access was available. These local documents are the current source of truth and need to be synchronised with the YouSee master workspace.

## Honest status
- Seeded contributions and one proposal are **synthetic** and labelled as such everywhere. They can be hidden or excluded from insights.
- No official datasets are ingested yet; district locations are approximate centroids.
- No pilot results, user counts or partnerships exist or are claimed.

## Accounts, rewards and admin publishing (added in 0.2.0)
- `/login`: email/password, phone OTP, and Google / Apple / Facebook OAuth. Social buttons require provider credentials; until then they explain exactly what is missing.
- `/account`: signed-in incident reporting, points, kudos, recognition level, and a form to submit climate-justice, policy and environmental actions for review.
- `/recognition`: public board built only from real rewards.
- `/updates`: blog posts, articles and announcements published by verified administrators.
- `/admin`: verified admin sign-in with **manually issued credentials**, plus tabs for publishing, kudos, activity review and creating further admin accounts. No social login for admins.
- Preview admin: `admin@yousee.local` / `YouseeAdmin2026!`. The passcode fallback remains for local testing. Replace both before a real pilot.
- Manual admin issuance: `node scripts/create-admin.mjs <email> <password-12+chars> <name>`.

## Design rule: no icon glyphs
No emoji, sparkle, star, pin or icon-font glyph is rendered anywhere in the UI. Meaning is carried by words, short text badges and CSS colour dots. Enforce with `node scripts/check-no-glyphs.mjs` (add it to CI). See `docs/MEDIA_GUIDE.md`.

## Photography
Four supplied Pexels photographs are stored locally in `public/images/` and used for the hero, village and mangrove imagery. Seven other registered photo assets for flooding, community engagement and city views are still missing and need suitable replacements. Every placement carries a caption, source credit and a disclosure that the image is illustrative regional photography, not Bandar Lampung and not evidence. See `docs/MEDIA_GUIDE.md`.
