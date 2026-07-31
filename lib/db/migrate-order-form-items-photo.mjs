/**
 * Migration: adds photo_url column to order_form_items table.
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
BEGIN;
ALTER TABLE order_form_items ADD COLUMN IF NOT EXISTS photo_url TEXT;
COMMIT;
`;

try {
  await pool.query(sql);
  console.log("✓ Migration complete: photo_url added to order_form_items");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
