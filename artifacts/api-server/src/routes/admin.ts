import { Router, type IRouter, type Request, type Response } from "express";
import { AdminLoginBody, AdminLoginResponse, GetAdminSessionResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

router.post("/admin/login", (req: Request, res: Response): void => {
  if (!ADMIN_PASSWORD) {
    req.log.error("ADMIN_PASSWORD is not configured");
    res.status(500).json({ error: "Admin login is not configured" });
    return;
  }

  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

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
