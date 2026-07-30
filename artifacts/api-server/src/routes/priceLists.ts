import { Router } from "express";
import { Readable } from "stream";
import { db, priceListsTable } from "@workspace/db";
import { requireAdmin, requirePortalAccess } from "../lib/adminAuth";
import { desc, eq } from "drizzle-orm";
import { objectStorageService } from "./storage";

const router = Router();

// ── Portal-gated routes ───────────────────────────────────────────────────────

/** GET /price-lists — list all price lists (requires portal or admin session) */
router.get("/price-lists", requirePortalAccess, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(priceListsTable)
      .orderBy(desc(priceListsTable.createdAt));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch price lists" });
  }
});

// ── Admin routes ──────────────────────────────────────────────────────────────

/** GET /price-lists/:id/download — stream a price list PDF (requires portal or admin session) */
router.get("/price-lists/:id/download", requirePortalAccess, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [priceList] = await db
      .select()
      .from(priceListsTable)
      .where(eq(priceListsTable.id, id));

    if (!priceList) {
      res.status(404).json({ error: "Price list not found" });
      return;
    }

    const objectFile = await objectStorageService.getObjectEntityFile(priceList.objectPath);
    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.setHeader("Content-Disposition", `attachment; filename="${priceList.fileName}"`);

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to download price list" });
  }
});

/** POST /admin/price-lists — register a price list after client-side upload */
router.post("/admin/price-lists", requireAdmin, async (req, res) => {
  const { title, period, objectPath, fileName } = req.body ?? {};

  if (!title || !period || !objectPath || !fileName) {
    res.status(400).json({ error: "title, period, objectPath and fileName are required" });
    return;
  }

  try {
    // Documents stay private — downloaded only through the portal-gated /price-lists/:id/download route
    const [priceList] = await db
      .insert(priceListsTable)
      .values({ title, period, objectPath, fileName })
      .returning();

    res.status(201).json(priceList);
  } catch (err) {
    res.status(500).json({ error: "Failed to create price list" });
  }
});

/** DELETE /admin/price-lists/:id — remove a price list record */
router.delete("/admin/price-lists/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [deleted] = await db
      .delete(priceListsTable)
      .where(eq(priceListsTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Price list not found" });
      return;
    }

    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete price list" });
  }
});

export default router;
