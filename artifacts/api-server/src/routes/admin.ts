import { Router, type IRouter, type Request, type Response } from "express";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminSessionResponse,
  ChangeAdminPasswordBody,
  ChangeAdminPasswordResponse,
  GetAdminRecoveryCodeStatusResponse,
  GenerateAdminRecoveryCodeResponse,
  ForgotAdminPasswordBody,
  ForgotAdminPasswordResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/adminAuth";
import {
  verifyAdminPassword,
  setAdminPassword,
  hasActiveRecoveryCode,
  generateRecoveryCode,
  verifyAndConsumeRecoveryCode,
} from "../lib/adminPassword";

const router: IRouter = Router();

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

router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  if (!process.env.ADMIN_PASSWORD) {
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

  if (!(await verifyAdminPassword(parsed.data.password))) {
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

router.post(
  "/admin/change-password",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = ChangeAdminPasswordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    if (!(await verifyAdminPassword(parsed.data.currentPassword))) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    await setAdminPassword(parsed.data.newPassword);
    res.json(ChangeAdminPasswordResponse.parse({ authenticated: true }));
  },
);

router.get(
  "/admin/recovery-code/status",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    res.json(
      GetAdminRecoveryCodeStatusResponse.parse({
        hasRecoveryCode: await hasActiveRecoveryCode(),
      }),
    );
  },
);

router.post(
  "/admin/recovery-code/generate",
  requireAdmin,
  async (_req: Request, res: Response): Promise<void> => {
    const code = await generateRecoveryCode();
    res.json(GenerateAdminRecoveryCodeResponse.parse({ code }));
  },
);

// Rate limiting for the recovery flow reuses the same throttle map/key space
// as login -- both are unauthenticated endpoints guarding the same secret.
router.post(
  "/admin/forgot-password",
  async (req: Request, res: Response): Promise<void> => {
    const key = req.ip ?? "unknown";
    if (isRateLimited(key)) {
      res.status(429).json({ error: "Too many attempts. Try again later." });
      return;
    }

    const parsed = ForgotAdminPasswordBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    if (!(await verifyAndConsumeRecoveryCode(parsed.data.recoveryCode))) {
      recordFailedAttempt(key);
      res.status(401).json({ error: "Invalid or already-used recovery code" });
      return;
    }

    await setAdminPassword(parsed.data.newPassword);
    loginAttempts.delete(key);
    req.session.isAdmin = true;
    res.json(ForgotAdminPasswordResponse.parse({ authenticated: true }));
  },
);

export default router;
