import { Router, type IRouter, type Request, type Response } from "express";
import { AdminLoginBody, AdminLoginResponse, GetAdminSessionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Simple in-memory throttle against online password guessing. This is a
// single shared-password login (no per-user accounts) so brute-force risk
// is otherwise unbounded. Keyed by IP; resets on server restart, which is
// an acceptable tradeoff for a low-traffic internal staff tool.
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    loginAttempts.set(key, { count: 0, windowStart: now });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(key: string): void {
  const entry = loginAttempts.get(key);
  if (!entry) {
    loginAttempts.set(key, { count: 1, windowStart: Date.now() });
    return;
  }
  entry.count += 1;
}

router.post("/admin/login", (req: Request, res: Response): void => {
  if (!ADMIN_PASSWORD) {
    req.log.error("ADMIN_PASSWORD is not configured");
    res.status(500).json({ error: "Admin login is not configured" });
    return;
  }

  const key = req.ip ?? "unknown";
  if (isRateLimited(key)) {
    res.status(429).json({ error: "Too many attempts. Try again later." });
    return;
  }

  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.password !== ADMIN_PASSWORD) {
    recordFailedAttempt(key);
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  loginAttempts.delete(key);
  req.session.isAdmin = true;
  res.json(AdminLoginResponse.parse({ authenticated: true }));
});

router.post("/admin/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.status(204).end();
  });
});

router.get("/admin/session", (req: Request, res: Response): void => {
  res.json(
    GetAdminSessionResponse.parse({ authenticated: Boolean(req.session.isAdmin) }),
  );
});

export default router;
