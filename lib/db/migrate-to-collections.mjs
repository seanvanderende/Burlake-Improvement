/**
 * One-time migration: converts the single `category` column on products into
 * the new many-to-many collections model.
 *
 * Steps:
 *  1. Create `collections` table
 *  2. Create `product_collections` junction table
 *  3. Seed the 6 legacy category values as named collections
 *  4. Link every product to its collection via the junction table
 *  5. Drop the now-redundant `category` column from products
 */

import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
BEGIN;

-- 1. Collections table
CREATE TABLE IF NOT EXISTS collections (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  slug        TEXT        NOT NULL UNIQUE,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- 2. Junction table
CREATE TABLE IF NOT EXISTS product_collections (
  product_id    INTEGER NOT NULL REFERENCES products(id)    ON DELETE CASCADE,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, collection_id)
);

-- 3. Seed the six legacy categories as collections
INSERT INTO collections (name, slug, sort_order) VALUES
  ('Tropical Foliage',       'tropicals',   1),
  ('Flowering Plants',       'flowering',   2),
  ('Planters & Upgrades',    'planters',    3),
  ('Easter',                 'easter',      4),
  ('Mother''s Day',          'mothers_day', 5),
  ('Cut Flowers & Bouquets', 'cut_flowers', 6)
ON CONFLICT (slug) DO NOTHING;

-- 4. Link products → collections (only if category column still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    INSERT INTO product_collections (product_id, collection_id)
    SELECT p.id, c.id
    FROM   products    p
    JOIN   collections c ON c.slug = p.category
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 5. Drop the legacy column (idempotent)
ALTER TABLE products DROP COLUMN IF EXISTS category;

COMMIT;
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
