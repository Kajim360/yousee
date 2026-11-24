# Privacy & Security

## Implemented
- No accounts required; anonymous or pseudonymous participation.
- Location precision chosen by the participant: ~100 m (3 dp), ~1 km (2 dp), district centroid or none. Raw geometry is admin-only.
- SheLens: district-only default; “unsafe” + exact is automatically reduced to approximate.
- Photos are resized and re-encoded in the browser (EXIF/GPS stripped). Photos are served publicly only for approved and public records.
- Versioned consent records (public display, research use, demographic use). Demographics are stored only with consent and reported only for n ≥ 5.
- PII auto-flag: submissions containing phone numbers or emails are held as `flagged`. PII is redacted before AI calls and in validation comments and proposals.
- Self-deletion via a private token (SHA-256 hashed at rest), cascading to media, consent and AI outputs.
- Moderator auth: HMAC-signed httpOnly cookie, 8 h expiry, timing-safe passcode comparison. Every moderator action is audited.
- Secrets only in server env; no keys in client bundles.
- Basic in-memory rate limit (10 submissions per 10 min per IP) and a honeypot field.

## Known risks / TODO before real pilot
| Risk | Mitigation planned |
|---|---|
| Shared passcode, default demo passcode | Set `ADMIN_PASSCODE`/`SESSION_SECRET`; migrate to Supabase Auth with roles (moderator, facilitator, researcher) |
| In-memory rate limit resets on restart and is per-instance | Redis/Upstash or edge rate limiting |
| Validation and support endpoints can be spammed | Add rate limits, CAPTCHA (e.g. Turnstile) |
| Retention is manual | Scheduled job purging rejected records after 90 days |
| Legal review | UU PDP No. 27/2022 compliance review; DPIA for SheLens |
| Photos in DB | Move to private object storage with signed URLs |


## 0.2.0 additions
- Accounts store a display name, optional email/phone, a scrypt password hash, provider and verification status. Admin accounts are issued manually. No sensitive attributes are inferred.
- OAuth accounts are matched by provider subject, never by email alone. State is HMAC-signed and short-lived.
- Phone codes are hashed, expire in 10 minutes, and are deleted after successful verification. Without an SMS provider the preview shows the code locally and says so.
- Recognition rewards are stored as separate records with moderator name and source. Public boards show display names only for public profiles.
- `SESSION_SECRET` must be set in production; the preview fallback is documented as insecure.
