import { Router } from "express";
import { Readable } from "stream";
import { db, brochuresTable, priceListsTable } from "@workspace/db";
import { requireAdmin, requirePortalAccess } from "../lib/adminAuth";
import { desc, eq } from "drizzle-orm";
import { objectStorageService } from "./storage";
import { getPortalCode, getPortalCodeVersion } from "../lib/portalSettings";

const router = Router();

// ── Customer auth ─────────────────────────────────────────────────────────────

/** POST /brochures/auth — customer enters password to unlock portal access */
router.post("/brochures/auth", async (req, res) => {
  const { password } = req.body ?? {};
  const expected = await getPortalCode();

  if (!expected) {
    res.status(503).json({ error: "Portal access not configured" });
    return;
  }

  if (!password || password !== expected) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  // Store the current version token so we can detect code rotations
  const version = await getPortalCodeVersion();
  req.session.hasBrochureAccess = true;
  req.session.portalCodeVersion = version ?? undefined;

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session error" });
      return;
    }
    res.json({ authenticated: true });
  });
});

/** GET /brochures/auth — check whether current session has portal access */
router.get("/brochures/auth", async (req, res) => {
  // Admin sessions are always valid
  if (req.session.isAdmin) {
    res.json({ authenticated: true });
    return;
  }

  if (req.session.hasBrochureAccess) {
    // Validate that the portal code hasn't been rotated since login
    const currentVersion = await getPortalCodeVersion();
    if (currentVersion && req.session.portalCodeVersion === currentVersion) {
      res.json({ authenticated: true });
      return;
    }
    // Version mismatch — code was rotated; clear stale session access
    req.session.hasBrochureAccess = false;
    req.session.portalCodeVersion = undefined;
    req.session.save(() => {});
  }

  res.json({ authenticated: false });
});

// ── Portal-gated routes ───────────────────────────────────────────────────────

/** GET /brochures — list all brochures (requires portal or admin session) */
router.get("/brochures", requirePortalAccess, async (_req, res) => {
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

/**
 * POST /admin/portal/backfill-acl — one-time admin utility.
 * Sets every existing brochure and price-list object to private ACL so they
 * cannot be fetched directly from /api/storage without portal authentication.
 * Idempotent; safe to call more than once.
 */
router.post("/admin/portal/backfill-acl", requireAdmin, async (_req, res) => {
  const brochureRows = await db.select({ id: brochuresTable.id, objectPath: brochuresTable.objectPath }).from(brochuresTable);
  const priceRows = await db.select({ id: priceListsTable.id, objectPath: priceListsTable.objectPath }).from(priceListsTable);
  const rows = [...brochureRows, ...priceRows];
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      await objectStorageService.trySetObjectEntityAclPolicy(row.objectPath, {
        owner: "admin",
        visibility: "private",
      });
      updated++;
    } catch (err: any) {
      if (err?.name === "ObjectNotFoundError") {
        skipped++;
      } else {
        errors.push(`id=${row.id}: ${err?.message}`);
      }
    }
  }

  res.json({ total: rows.length, updated, skipped, errors });
});

/** GET /brochures/:id/download — stream a brochure PDF (requires portal or admin session) */
router.get("/brochures/:id/download", requirePortalAccess, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [brochure] = await db
      .select()
      .from(brochuresTable)
      .where(eq(brochuresTable.id, id));

    if (!brochure) {
      res.status(404).json({ error: "Brochure not found" });
      return;
    }

    const objectFile = await objectStorageService.getObjectEntityFile(brochure.objectPath);
    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.setHeader("Content-Disposition", `attachment; filename="${brochure.fileName}"`);

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to download brochure" });
  }
});

/** POST /admin/brochures — register a brochure after client-side upload */
router.post("/admin/brochures", requireAdmin, async (req, res) => {
  const { title, season, objectPath, fileName } = req.body ?? {};

  if (!title || !season || !objectPath || !fileName) {
    res.status(400).json({ error: "title, season, objectPath and fileName are required" });
    return;
  }

  try {
    // Documents stay private — downloaded only through the portal-gated /brochures/:id/download route
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
  const id = parseInt(String(req.params.id), 10);
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
