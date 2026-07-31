import type { NextFunction, Request, Response } from "express";
import { getPortalCode, getPortalCodeVersion } from "./portalSettings";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    hasBrochureAccess?: boolean;
    /** Version token at the time portal access was granted. */
    portalCodeVersion?: string;
  }
}

/**
 * Middleware guarding admin-only routes (product mutations, image uploads).
 * Uses a simple shared-password session (no per-user accounts) per the
 * business's staff-only, low-friction requirement.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.session.isAdmin) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

/**
 * Middleware guarding Customer Portal routes (brochures, price lists, etc.).
 * Passes if the session has portal access (and the code hasn't been rotated
 * since login), admin access, OR the request carries a valid Bearer token
 * (used by the mobile app, which cannot use cookie-based sessions).
 *
 * When the portal code is rotated, `portalCodeVersion` in the session will
 * no longer match the current version, so existing portal sessions are
 * transparently invalidated on the next request.
 */
export async function requirePortalAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Admin sessions always pass through
  if (req.session.isAdmin) {
    next();
    return;
  }

  // Cookie-session path (web portal): verify the version token hasn't rotated
  if (req.session.hasBrochureAccess) {
    const currentVersion = await getPortalCodeVersion();
    if (currentVersion && req.session.portalCodeVersion === currentVersion) {
      next();
      return;
    }
    // Version mismatch — code was rotated; clear stale portal access
    req.session.hasBrochureAccess = false;
    req.session.portalCodeVersion = undefined;
  }

  // Bearer-token path (mobile app)
  const authHeader = req.headers["authorization"];
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    const expected = await getPortalCode();
    if (expected && token === expected) {
      next();
      return;
    }
  }

  res.status(401).json({ error: "Unauthorized" });
}
