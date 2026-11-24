# Deployment Guide

## Current
Platform-managed: build → start → health check at `/api/health`. The database schema is applied with `npx drizzle-kit push`. Seed data is inserted on first request (idempotent, protected by an advisory lock).

## Production (Vercel + Supabase), recommended
1. Create a Supabase project (region: Singapore). Enable PostGIS.
2. Set `DATABASE_URL` (pooled connection string) in Vercel.
3. Generate and apply migrations: `npx drizzle-kit generate && npx drizzle-kit migrate`.
4. Set `ADMIN_PASSCODE`, `SESSION_SECRET` (32+ random bytes) and optionally `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`.
5. Connect the GitHub repo to Vercel; deploy; verify `/api/health`.
6. Connect the domain; enforce HTTPS.
7. Monitoring: Vercel logs plus an uptime check on `/api/health`; review Admin → AI evaluation weekly.
8. Remove or hide synthetic data before a public pilot: `DELETE FROM contributions WHERE is_synthetic;` and `DELETE FROM proposals WHERE is_synthetic;`.
   Note: the seeder only runs when the `cities` table is empty, so deleting synthetic rows will not re-seed them.


## 0.2.0 configuration
Set `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, provider OAuth credentials, Twilio credentials (for real SMS), and `ADMIN_BOOTSTRAP_*`. Register exact OAuth callback URLs: `/api/auth/oauth/google/callback`, `/api/auth/oauth/apple/callback`, `/api/auth/oauth/facebook/callback`. Remove the preview admin account and the shared passcode fallback before a public pilot.
