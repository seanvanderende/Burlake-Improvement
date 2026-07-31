/**
 * Migration: creates order_forms and order_form_items tables.
 * order_forms — one form per customer/season
 * order_form_items — the product line items within each form
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
BEGIN;

CREATE TABLE IF NOT EXISTS order_forms (
  id            SERIAL      PRIMARY KEY,
  title         TEXT        NOT NULL,
  customer_name TEXT        NOT NULL,
  description   TEXT,
  season        TEXT,
  deadline      DATE,
  status        TEXT        NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_form_items (
  id         SERIAL        PRIMARY KEY,
  form_id    INT           NOT NULL REFERENCES order_forms(id) ON DELETE CASCADE,
  name       TEXT          NOT NULL,
  item_num   TEXT,
  upc        TEXT,
  pack       TEXT,
  case_price NUMERIC(10,2),
  category   TEXT,
  sort_order INT           NOT NULL DEFAULT 0,
  created_at TIMESTAMP     NOT NULL DEFAULT NOW()
);

COMMIT;
`;

try {
  await pool.query(sql);
  console.log("✓ Migration complete: order_forms + order_form_items tables created");
} catch (err) {
  console.error("✗ Migration failed:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
