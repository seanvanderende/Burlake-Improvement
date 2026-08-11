/**
 * One-time migration: adds a `created_at` timestamp to `product_collections`
 * so the catalog can determine which collection a product was tagged with
 * first (used as the tie-break for the default catalog sort when a product
 * belongs to more than one collection).
 *
 * Existing rows get `NOW()` as a best-effort default since real assignment
 * order isn't recoverable for historical data.
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
ALTER TABLE product_collections
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
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
