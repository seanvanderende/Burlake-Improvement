/**
 * Portal settings service.
 *
 * The Customer Portal access code is stored in the `settings` DB table so
 * staff can rotate it without developer help.  The env var BROCHURE_PASSWORD
 * seeds the initial value and acts as a hard fallback if the DB is
 * unreachable.
 *
 * No in-process cache is used so that code rotations are visible to all
 * requests immediately — every auth check reads directly from the DB.
 */

import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const KEY_CODE = "portal_code";
const KEY_VERSION = "portal_code_version";

async function readSetting(key: string): Promise<string | null> {
  try {
    const [row] = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, key));
    return row?.value ?? null;
  } catch {
    return null;
  }
}

/** Get the current portal access code. Falls back to env var if DB has none. */
export async function getPortalCode(): Promise<string | null> {
  const code = await readSetting(KEY_CODE);
  return code ?? process.env["BROCHURE_PASSWORD"] ?? null;
}

/**
 * Get the current portal code version token.
 * Changes every time the code is rotated, enabling session invalidation.
 */
export async function getPortalCodeVersion(): Promise<string | null> {
  return readSetting(KEY_VERSION);
}

/**
 * Persist a new portal code and rotate the version token.
 * Because there is no in-process cache, all subsequent DB reads immediately
 * reflect the new values.
 */
export async function setPortalCode(newCode: string): Promise<string> {
  const newVersion = crypto.randomUUID();

  await db
    .insert(settingsTable)
    .values({ key: KEY_CODE, value: newCode })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: newCode, updatedAt: new Date() } });

  await db
    .insert(settingsTable)
    .values({ key: KEY_VERSION, value: newVersion })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value: newVersion, updatedAt: new Date() } });

  return newVersion;
}

/**
 * Ensure the settings table contains at least an initial portal code.
 * Seeds from BROCHURE_PASSWORD env var when no DB value exists.
 * Called once at server startup.
 */
export async function ensurePortalSettingsSeed(): Promise<void> {
  const envCode = process.env["BROCHURE_PASSWORD"];

  try {
    if (envCode) {
      await db
        .insert(settingsTable)
        .values({ key: KEY_CODE, value: envCode })
        .onConflictDoNothing();
    }

    // Ensure a version token exists (without overwriting an existing one)
    await db
      .insert(settingsTable)
      .values({ key: KEY_VERSION, value: crypto.randomUUID() })
      .onConflictDoNothing();
  } catch (err) {
    // Non-fatal — the env var fallback still works
    console.warn("[portalSettings] seed failed:", err);
  }
}
