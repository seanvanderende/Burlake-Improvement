/**
 * One-time migration: creates the `unsubscribe_requests` table backing the
 * public unsubscribe page. Submissions are reviewed by staff from an admin
 * page — no email is sent.
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
CREATE TABLE IF NOT EXISTS unsubscribe_requests (
  id SERIAL PRIMARY KEY,
  business_name_or_account_number TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

try {
  await pool.query(sql);
  console.log("✓ Migration complete");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
