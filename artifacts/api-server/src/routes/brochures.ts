import { Router } from "express";
import { db, brochuresTable } from "@workspace/db";
import { requireAdmin } from "../lib/adminAuth";
import { desc, eq } from "drizzle-orm";
import { objectStorageService } from "./storage";

const router = Router();

// ── Customer auth ─────────────────────────────────────────────────────────────

/** POST /brochures/auth — customer enters password to unlock brochure access */
router.post("/brochures/auth", (req, res) => {
  const { password } = req.body ?? {};
  const expected = process.env.BROCHURE_PASSWORD;

  if (!expected) {
    res.status(503).json({ error: "Brochure access not configured" });
    return;
  }

  if (!password || password !== expected) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  req.session.hasBrochureAccess = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.json({ authenticated: true });
  });
});

/** GET /brochures/auth — check whether current session has brochure access */
router.get("/brochures/auth", (req, res) => {
  res.json({ authenticated: !!(req.session.hasBrochureAccess || req.session.isAdmin) });
});

// ── Middleware: brochure access or admin ──────────────────────────────────────

function requireBrochureAccess(
  req: Parameters<typeof requireAdmin>[0],
  res: Parameters<typeof requireAdmin>[1],
  next: Parameters<typeof requireAdmin>[2],
) {
  if (req.session.hasBrochureAccess || req.session.isAdmin) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

// ── Public (brochure-access-gated) routes ─────────────────────────────────────

/** GET /brochures — list all brochures (requires brochure or admin session) */
router.get("/brochures", requireBrochureAccess, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(brochuresTable)
      .orderBy(desc(brochuresTable.createdAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch brochures" });
  }
});

// ── Admin routes ──────────────────────────────────────────────────────────────

/** POST /admin/brochures — register a brochure after client-side upload */
router.post("/admin/brochures", requireAdmin, async (req, res) => {
  const { title, season, objectPath, fileName } = req.body ?? {};

  if (!title || !season || !objectPath || !fileName) {
    res.status(400).json({ error: "title, season, objectPath and fileName are required" });
    return;
  }

  try {
    // Make the uploaded PDF publicly accessible
    await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
      owner: "admin",
      visibility: "public",
    });

    const [brochure] = await db
      .insert(brochuresTable)
      .values({ title, season, objectPath, fileName })
      .returning();

    res.status(201).json(brochure);
  } catch (err) {
    res.status(500).json({ error: "Failed to create brochure" });
  }
});

/** DELETE /admin/brochures/:id — remove a brochure record */
router.delete("/admin/brochures/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(brochuresTable)
      .where(eq(brochuresTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Brochure not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete brochure" });
  }
});

export default router;
