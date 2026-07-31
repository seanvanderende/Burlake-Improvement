import type { NextFunction, Request, Response } from "express";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    hasBrochureAccess?: boolean;
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
 * Passes if the session has portal access, admin access, OR the request
 * carries a valid Bearer token (used by the mobile app, which cannot use
 * cookie-based sessions).
 */
export function requirePortalAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Cookie-session path (web portal)
  if (req.session.hasBrochureAccess || req.session.isAdmin) {
    next();
    return;
  }

  // Bearer-token path (mobile app)
  const authHeader = req.headers["authorization"];
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (header?.startsWith("Bearer ")) {
    const token = header.slice(7);
    const expected = process.env["BROCHURE_PASSWORD"];
    if (expected && token === expected) {
      next();
      return;
    }
  }

  res.status(401).json({ error: "Unauthorized" });
}
