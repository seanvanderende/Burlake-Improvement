import { Router } from "express";
import { requireAdmin } from "../lib/adminAuth";
import { hasPortalCode, getPortalCodeVersion, setPortalCode } from "../lib/portalSettings";

const router = Router();

/**
 * GET /admin/portal-settings
 * Returns whether a portal code is currently set and its version token.
 * Requires an active admin session.
 *
 * The code is hashed at rest (see lib/portalSettings.ts), so it can no
 * longer be partially revealed here the way it used to be -- staff can
 * confirm one is set and rotate it, but not read back what it is.
 */
router.get("/admin/portal-settings", requireAdmin, async (_req, res) => {
  try {
    const hasCode = await hasPortalCode();
    const version = await getPortalCodeVersion();

    res.json({ hasCode, maskedCode: null, version });
  } catch {
    res.status(500).json({ error: "Failed to load portal settings" });
  }
});

/**
 * PUT /admin/portal-settings
 * Body: { code: string }
 * Saves the new portal code and rotates the version token.
 * All existing portal sessions will be invalidated on their next request.
 */
router.put("/admin/portal-settings", requireAdmin, async (req, res) => {
  const { code } = req.body ?? {};

  if (!code || typeof code !== "string" || code.trim().length < 4) {
    res.status(400).json({ error: "code must be at least 4 characters" });
    return;
  }

  try {
    const newVersion = await setPortalCode(code.trim());
    res.json({ success: true, version: newVersion });
  } catch {
    res.status(500).json({ error: "Failed to update portal settings" });
  }
});

export default router;
