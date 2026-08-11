/**
 * Admin password + recovery code service.
 *
 * The staff admin password is a single shared secret (no per-user accounts).
 * Historically it lived only in the ADMIN_PASSWORD env var, which meant a
 * developer had to be involved any time it needed to change or was
 * forgotten. This mirrors the Customer Portal code pattern
 * (see `portalSettings.ts`): the password is hashed and stored in the
 * `settings` table so staff can change it themselves, and a one-time
 * recovery code lets them reset it even if they're completely locked out.
 */

import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const KEY_PASSWORD_HASH = "admin_password_hash";
const KEY_RECOVERY_HASH = "admin_recovery_code_hash";

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
    const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
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

async function deleteSetting(key: string): Promise<void> {
  await db.delete(settingsTable).where(eq(settingsTable.key, key));
}

/**
 * Seed the DB-backed password hash from ADMIN_PASSWORD on startup, without
 * overwriting a password staff have already changed via the UI.
 */
export async function ensureAdminPasswordSeed(): Promise<void> {
  const envPassword = process.env["ADMIN_PASSWORD"];
  if (!envPassword) return;

  try {
    const existing = await readSetting(KEY_PASSWORD_HASH);
    if (!existing) {
      await writeSetting(KEY_PASSWORD_HASH, hashSecret(envPassword));
    }
  } catch (err) {
    // Non-fatal — login can still fall back to the raw env var comparison below.
    console.warn("[adminPassword] seed failed:", err);
  }
}

/** Check a submitted password against the stored hash (or env var as a last-resort fallback). */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const storedHash = await readSetting(KEY_PASSWORD_HASH);
  if (storedHash) {
    return verifySecret(password, storedHash);
  }

  // No DB hash yet (e.g. DB was unreachable at startup) — fall back to the
  // raw env var so staff are never locked out by a seeding hiccup.
  const envPassword = process.env["ADMIN_PASSWORD"];
  return Boolean(envPassword) && password === envPassword;
}

/** Set a new admin password, replacing whatever was there before. */
export async function setAdminPassword(newPassword: string): Promise<void> {
  await writeSetting(KEY_PASSWORD_HASH, hashSecret(newPassword));
}

/** Whether a recovery code is currently active (i.e. can still be used). */
export async function hasActiveRecoveryCode(): Promise<boolean> {
  return (await readSetting(KEY_RECOVERY_HASH)) !== null;
}

/**
 * Generate a brand-new recovery code, replacing any previous one.
 * Returns the plaintext code -- this is the only time it is ever visible;
 * only its hash is persisted.
 */
export async function generateRecoveryCode(): Promise<string> {
  // Human-friendly: 4 groups of 4 uppercase alphanumeric chars, e.g. AB12-CD34-EF56-GH78
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let group = "";
    for (let i = 0; i < 4; i++) {
      group += alphabet[crypto.randomInt(alphabet.length)];
    }
    groups.push(group);
  }
  const code = groups.join("-");

  await writeSetting(KEY_RECOVERY_HASH, hashSecret(code));
  return code;
}

/**
 * Verify a recovery code and, if valid, consume it (one-time use) so it
 * can't be replayed. Returns true iff the code matched.
 */
export async function verifyAndConsumeRecoveryCode(code: string): Promise<boolean> {
  const storedHash = await readSetting(KEY_RECOVERY_HASH);
  if (!storedHash) return false;

  const valid = verifySecret(code.trim(), storedHash);
  if (valid) {
    await deleteSetting(KEY_RECOVERY_HASH);
  }
  return valid;
}
