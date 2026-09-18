/**
 * Portal settings service.
 *
 * The Customer Portal access code is stored in the `settings` DB table so
 * staff can rotate it without developer help.  The env var BROCHURE_PASSWORD
 * seeds the initial value and acts as a hard fallback if the DB is
 * unreachable.
 *
 * The code is hashed at rest (scrypt, salted, timing-safe compare) the same
 * way the admin password is in adminPassword.ts, rather than stored in
 * plaintext -- so a DB leak doesn't hand out the live portal code directly.
 *
 * No in-process cache is used so that code rotations are visible to all
 * requests immediately — every auth check reads directly from the DB.
 */

import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const KEY_CODE_HASH = "portal_code_hash";
const KEY_VERSION = "portal_code_version";

const SCRYPT_KEYLEN = 64;

function hashSecret(secret: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(secret, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

function verifySecret(secret: string, stored: string): boolean {
  const [salt, derivedHex] = stored.split(":");
  if (!salt || !derivedHex) return false;
  const derived = crypto.scryptSync(secret, salt, SCRYPT_KEYLEN);
  const expected = Buffer.from(derivedHex, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

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

async function writeSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
}

/** Whether a portal code is currently configured (DB hash or env fallback). */
export async function hasPortalCode(): Promise<boolean> {
  const hash = await readSetting(KEY_CODE_HASH);
  return Boolean(hash) || Boolean(process.env["BROCHURE_PASSWORD"]);
}

/**
 * Verify a submitted portal code against the stored hash (or the raw env
 * var as a last-resort fallback if the DB has no hash yet). Timing-safe.
 */
export async function verifyPortalCode(candidate: string): Promise<boolean> {
  const storedHash = await readSetting(KEY_CODE_HASH);
  if (storedHash) {
    return verifySecret(candidate, storedHash);
  }

  const envCode = process.env["BROCHURE_PASSWORD"];
  if (!envCode) return false;
  // Constant-time even on the env-var fallback path.
  const a = Buffer.from(candidate);
  const b = Buffer.from(envCode);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Get the current portal code version token.
 * Changes every time the code is rotated, enabling session invalidation.
 */
export async function getPortalCodeVersion(): Promise<string | null> {
  return readSetting(KEY_VERSION);
}

/**
 * Persist a new portal code (hashed) and rotate the version token.
 * Because there is no in-process cache, all subsequent DB reads immediately
 * reflect the new values.
 */
export async function setPortalCode(newCode: string): Promise<string> {
  const newVersion = crypto.randomUUID();

  await writeSetting(KEY_CODE_HASH, hashSecret(newCode));
  await writeSetting(KEY_VERSION, newVersion);

  return newVersion;
}

/**
 * Ensure the settings table contains at least an initial portal code hash.
 * Seeds from BROCHURE_PASSWORD env var when no DB value exists yet, without
 * overwriting a code staff have already rotated via the UI.
 * Called once at server startup.
 */
export async function ensurePortalSettingsSeed(): Promise<void> {
  const envCode = process.env["BROCHURE_PASSWORD"];

  try {
    if (envCode) {
      const existing = await readSetting(KEY_CODE_HASH);
      if (!existing) {
        await writeSetting(KEY_CODE_HASH, hashSecret(envCode));
      }
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
