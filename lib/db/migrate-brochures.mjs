/**
 * Migration: creates the `brochures` table for seasonal PDF brochures.
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
BEGIN;

CREATE TABLE IF NOT EXISTS brochures (
  id          SERIAL      PRIMARY KEY,
  title       TEXT        NOT NULL,
  season      TEXT        NOT NULL,
  object_path TEXT        NOT NULL,
  file_name   TEXT        NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMIT;
`;

try {
  await pool.query(sql);
  console.log("✓ Migration complete: brochures table created");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
