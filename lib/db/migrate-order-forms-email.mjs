/**
 * Migration: adds reply_to_email column to order_forms table.
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
BEGIN;
ALTER TABLE order_forms ADD COLUMN IF NOT EXISTS reply_to_email TEXT;
COMMIT;
`;

try {
  await pool.query(sql);
  console.log("✓ Migration complete: reply_to_email added to order_forms");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
