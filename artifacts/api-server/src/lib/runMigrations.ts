/**
 * Lightweight startup migrations.
 * Uses raw SQL via the shared pg Pool — no drizzle-kit TTY requirement.
 * Each statement is idempotent (CREATE TABLE IF NOT EXISTS, etc.).
 */

import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key        text        PRIMARY KEY,
        value      text        NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id         serial      PRIMARY KEY,
        path       text        NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at);
    `);
    logger.info("Migrations complete");
  } catch (err) {
    logger.error({ err }, "Migration failed");
    throw err;
  } finally {
    client.release();
  }
}
