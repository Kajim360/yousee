# Accounts, Recognition & Admin Credentials

## User login (`/login`)
- Email + password (scrypt hash with per-password salt). Registration always creates a `participant` account; role escalation is impossible through the API.
- Phone OTP: 6-digit code, SHA-256 hashed with the phone, 10-minute expiry, 5 attempts, rate-limited. With Twilio configured the code is sent by SMS. Without it, the preview returns the code to the browser and explicitly says no SMS provider is configured.
- Google, Apple, Facebook: real OAuth 2.0 authorisation-code flows with signed state, token exchange and account upsert by `(provider, provider_subject)` — never by email alone. Apple uses an ES256 client secret signed from `APPLE_PRIVATE_KEY`. If credentials are missing, the button redirects back with a clear configuration notice. No fake social login.
- Sessions: HMAC-signed httpOnly cookies (`yousee_user`), 14 days.

## Recognition
| Source | Points | When |
|---|---|---|
| Incident report | 10 | A moderator approves a contribution linked to the account; one award per contribution |
| Climate justice / policy action | 30 | Admin verifies a submitted action (evidence link encouraged) |
| Environmental activity | 25 | Same |
| Community organising | 20 | Same |
| Kudos | 15 | Admin awards with a written reason; audit-logged |

Public board (`/recognition`) lists real participants with public profiles and at least one award. Points are not money, votes or official endorsement. The account page shows all rewards with date and awarding moderator.

## Admin accounts
- Admin accounts are created **manually** by the system operator, never self-registered and never via Google/Apple/Facebook/phone.
- Preview bootstrap: `admin@yousee.local` / `YouseeAdmin2026!`, clearly labelled. Replace with `ADMIN_BOOTSTRAP_EMAIL` / `ADMIN_BOOTSTRAP_PASSWORD` or delete it.
- CLI: `node scripts/create-admin.mjs <email> <password-12+chars> <name>`.
- Dashboard: verified admins can create further verified admins after offline identity checks; the action is audit-logged.
- `getAdmin()` accepts either a verified admin account session or the legacy shared passcode (local testing only).
- Admin content: blog posts, articles and announcements with draft/publish/archive, cover image from the documented photo registry, author name and date. Public at `/updates`.
