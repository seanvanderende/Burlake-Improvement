/**
 * One-shot migration: create applications table
 * Run with: node lib/db/migrate-applications.mjs
 */
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id          SERIAL PRIMARY KEY,
      business_name  TEXT NOT NULL,
      contact_name   TEXT NOT NULL,
      email          TEXT NOT NULL,
      phone          TEXT NOT NULL,
      business_type  TEXT NOT NULL,
      monthly_volume TEXT,
      notes          TEXT,
      status         TEXT NOT NULL DEFAULT 'pending',
      created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ applications table created (or already exists)");
} finally {
  await pool.end();
}
