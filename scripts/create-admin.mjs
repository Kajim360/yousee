/**
 * Manually issue a verified administrator account.
 * Usage: node scripts/create-admin.mjs "admin@example.org" "a-long-private-password" "Full Name"
 * The operator must verify the person's identity offline before running this.
 * Never uses social login; never accepts a self-registration from the web.
 */
import "dotenv/config";
import pg from "pg";
import { randomBytes, scryptSync } from "node:crypto";

const [email, password, displayName] = process.argv.slice(2);
if (!email || !password || !displayName || password.length < 12 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password-12+chars> <displayName>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const existing = await client.query("select id from users where email = $1", [email.toLowerCase()]);
  if (existing.rows.length) {
    console.error("An account with that email already exists. Nothing changed.");
    process.exit(2);
  }
  await client.query(
    `insert into users (display_name, email, password_hash, provider, role, verified, verification_note)
     values ($1,$2,$3,'manual','admin',true,$4)`,
    [displayName, email.toLowerCase(), passwordHash, "Issued manually by the system operator after offline identity verification."]
  );
  console.log("Verified admin account created. Deliver the password privately and delete it from any shared channel.");
} finally {
  await client.end();
}
