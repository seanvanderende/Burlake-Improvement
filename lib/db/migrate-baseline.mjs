/**
 * Baseline migration: creates the `products` table if it does not already
 * exist. This must run before any migration that references products (e.g.
 * migrate-to-collections.mjs which creates the product_collections FK).
 *
 * Idempotent — safe to run on both fresh and already-populated databases.
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
BEGIN;

CREATE TABLE IF NOT EXISTS products (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL,
  image_url   TEXT,
  sku         TEXT,
  size        TEXT,
  description TEXT,
  available   BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

COMMIT;
`;

try {
  await pool.query(sql);
  console.log("✓ Baseline migration complete: products table ready");
} catch (err) {
  console.error("✗ Baseline migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
