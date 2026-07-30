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
