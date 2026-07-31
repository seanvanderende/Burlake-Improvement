import { Router } from "express";
import { requireAdmin } from "../lib/adminAuth";
import { getPortalCode, getPortalCodeVersion, setPortalCode } from "../lib/portalSettings";

const router = Router();

/**
 * GET /admin/portal-settings
 * Returns the current portal code (masked) and version token.
 * Requires an active admin session.
 */
router.get("/admin/portal-settings", requireAdmin, async (_req, res) => {
  try {
    const code = await getPortalCode();
    const version = await getPortalCodeVersion();

    res.json({
      hasCode: !!code,
      // Mask all but the last 2 chars so staff can confirm which code is active
      maskedCode: code ? "*".repeat(Math.max(0, code.length - 2)) + code.slice(-2) : null,
      version,
    });
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
