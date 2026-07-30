/**
 * Migration: creates the `price_lists` table for wholesale price list PDFs.
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
BEGIN;

CREATE TABLE IF NOT EXISTS price_lists (
  id          SERIAL      PRIMARY KEY,
  title       TEXT        NOT NULL,
  period      TEXT        NOT NULL,
  object_path TEXT        NOT NULL,
  file_name   TEXT        NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMIT;
`;

try {
  await pool.query(sql);
  console.log("✓ Migration complete: price_lists table created");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
