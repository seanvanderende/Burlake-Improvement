import { Router } from "express";
import { db, orderFormsTable, orderFormItemsTable } from "@workspace/db";
import { requireAdmin, requirePortalAccess } from "../lib/adminAuth";
import { desc, eq, asc } from "drizzle-orm";

const router = Router();

// ── Portal-gated routes ───────────────────────────────────────────────────────

/** GET /order-forms — list active order forms (portal or admin) */
router.get("/order-forms", requirePortalAccess, async (_req, res) => {
  try {
    const forms = await db
      .select()
      .from(orderFormsTable)
      .where(eq(orderFormsTable.status, "active"))
      .orderBy(desc(orderFormsTable.createdAt));
    res.json(forms);
  } catch {
    res.status(500).json({ error: "Failed to fetch order forms" });
  }
});

/** GET /order-forms/:id — get a single form with its items (portal or admin) */
router.get("/order-forms/:id", requirePortalAccess, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [form] = await db
      .select()
      .from(orderFormsTable)
      .where(eq(orderFormsTable.id, id));

    if (!form) { res.status(404).json({ error: "Order form not found" }); return; }

    // Portal buyers may only access active forms
    if (form.status !== "active") {
      const msg = form.status === "draft"
        ? "This form is not yet available"
        : "This form is no longer accepting orders";
      res.status(403).json({ error: msg });
      return;
    }

    // Enforce deadline: if the deadline date (inclusive) has passed in UTC,
    // buyers can no longer submit orders even if staff haven't closed the form yet
    if (form.deadline) {
      const todayUTC = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      if (form.deadline < todayUTC) {
        res.status(403).json({ error: "The order deadline for this form has passed" });
        return;
      }
    }

    const items = await db
      .select()
      .from(orderFormItemsTable)
      .where(eq(orderFormItemsTable.formId, id))
      .orderBy(asc(orderFormItemsTable.sortOrder), asc(orderFormItemsTable.id));

    res.json({ ...form, items });
  } catch {
    res.status(500).json({ error: "Failed to fetch order form" });
  }
});

// ── Admin routes ──────────────────────────────────────────────────────────────

/** GET /admin/order-forms — list all forms regardless of status */
router.get("/admin/order-forms", requireAdmin, async (_req, res) => {
  try {
    const forms = await db
      .select()
      .from(orderFormsTable)
      .orderBy(desc(orderFormsTable.createdAt));
    res.json(forms);
  } catch {
    res.status(500).json({ error: "Failed to fetch order forms" });
  }
});

/** GET /admin/order-forms/:id — get form with items (admin) */
router.get("/admin/order-forms/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [form] = await db.select().from(orderFormsTable).where(eq(orderFormsTable.id, id));
    if (!form) { res.status(404).json({ error: "Order form not found" }); return; }

    const items = await db
      .select()
      .from(orderFormItemsTable)
      .where(eq(orderFormItemsTable.formId, id))
      .orderBy(asc(orderFormItemsTable.sortOrder), asc(orderFormItemsTable.id));

    res.json({ ...form, items });
  } catch {
    res.status(500).json({ error: "Failed to fetch order form" });
  }
});

/** POST /admin/order-forms — create a new order form */
router.post("/admin/order-forms", requireAdmin, async (req, res) => {
  const { title, customerName, description, season, deadline, status, replyToEmail } = req.body ?? {};
  if (!title || !customerName) {
    res.status(400).json({ error: "title and customerName are required" }); return;
  }
  try {
    const [form] = await db
      .insert(orderFormsTable)
      .values({ title, customerName, description, season, deadline: deadline || null, status: status || "draft", replyToEmail: replyToEmail || null })
      .returning();
    res.status(201).json(form);
  } catch {
    res.status(500).json({ error: "Failed to create order form" });
  }
});

/** PATCH /admin/order-forms/:id — update form metadata */
router.patch("/admin/order-forms/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { title, customerName, description, season, deadline, status, replyToEmail } = req.body ?? {};
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (customerName !== undefined) updates.customerName = customerName;
  if (description !== undefined) updates.description = description;
  if (season !== undefined) updates.season = season;
  if (deadline !== undefined) updates.deadline = deadline || null;
  if (status !== undefined) updates.status = status;
  if (replyToEmail !== undefined) updates.replyToEmail = replyToEmail || null;

  try {
    const [form] = await db
      .update(orderFormsTable)
      .set(updates)
      .where(eq(orderFormsTable.id, id))
      .returning();
    if (!form) { res.status(404).json({ error: "Order form not found" }); return; }
    res.json(form);
  } catch {
    res.status(500).json({ error: "Failed to update order form" });
  }
});

/** DELETE /admin/order-forms/:id — delete form and all its items (cascade) */
router.delete("/admin/order-forms/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [deleted] = await db.delete(orderFormsTable).where(eq(orderFormsTable.id, id)).returning();
    if (!deleted) { res.status(404).json({ error: "Order form not found" }); return; }
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Failed to delete order form" });
  }
});

// ── Item routes ───────────────────────────────────────────────────────────────

/** POST /admin/order-forms/:id/items — add one item */
router.post("/admin/order-forms/:id/items", requireAdmin, async (req, res) => {
  const formId = parseInt(String(req.params.id), 10);
  if (isNaN(formId)) { res.status(400).json({ error: "Invalid form id" }); return; }

  const { name, itemNum, upc, pack, casePrice, category, sortOrder } = req.body ?? {};
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  try {
    const [item] = await db
      .insert(orderFormItemsTable)
      .values({
        formId,
        name,
        itemNum: itemNum || null,
        upc: upc || null,
        pack: pack || null,
        casePrice: casePrice != null ? String(casePrice) : null,
        category: category || null,
        sortOrder: sortOrder ?? 0,
      })
      .returning();
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: "Failed to create item" });
  }
});

/** POST /admin/order-forms/:id/items/bulk — bulk-add items from an array */
router.post("/admin/order-forms/:id/items/bulk", requireAdmin, async (req, res) => {
  const formId = parseInt(String(req.params.id), 10);
  if (isNaN(formId)) { res.status(400).json({ error: "Invalid form id" }); return; }

  const { items } = req.body ?? {};
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "items array is required" }); return;
  }

  try {
    const rows = items.map((it: Record<string, unknown>, i: number) => ({
      formId,
      name: String(it.name || ""),
      itemNum: it.itemNum ? String(it.itemNum) : null,
      upc: it.upc ? String(it.upc) : null,
      pack: it.pack ? String(it.pack) : null,
      casePrice: it.casePrice != null ? String(it.casePrice) : null,
      category: it.category ? String(it.category) : null,
      sortOrder: typeof it.sortOrder === "number" ? it.sortOrder : i,
    })).filter(r => r.name);

    if (rows.length === 0) { res.status(400).json({ error: "No valid items found" }); return; }

    const inserted = await db.insert(orderFormItemsTable).values(rows).returning();
    res.status(201).json(inserted);
  } catch {
    res.status(500).json({ error: "Failed to bulk-create items" });
  }
});

/** PATCH /admin/order-forms/:id/items/:itemId — update one item */
router.patch("/admin/order-forms/:id/items/:itemId", requireAdmin, async (req, res) => {
  const itemId = parseInt(String(req.params.itemId), 10);
  if (isNaN(itemId)) { res.status(400).json({ error: "Invalid item id" }); return; }

  const { name, itemNum, upc, pack, casePrice, category, sortOrder } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (itemNum !== undefined) updates.itemNum = itemNum || null;
  if (upc !== undefined) updates.upc = upc || null;
  if (pack !== undefined) updates.pack = pack || null;
  if (casePrice !== undefined) updates.casePrice = casePrice != null ? String(casePrice) : null;
  if (category !== undefined) updates.category = category || null;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  try {
    const [item] = await db
      .update(orderFormItemsTable)
      .set(updates)
      .where(eq(orderFormItemsTable.id, itemId))
      .returning();
    if (!item) { res.status(404).json({ error: "Item not found" }); return; }
    res.json(item);
  } catch {
    res.status(500).json({ error: "Failed to update item" });
  }
});

/** DELETE /admin/order-forms/:id/items/:itemId — delete one item */
router.delete("/admin/order-forms/:id/items/:itemId", requireAdmin, async (req, res) => {
  const itemId = parseInt(String(req.params.itemId), 10);
  if (isNaN(itemId)) { res.status(400).json({ error: "Invalid item id" }); return; }

  try {
    const [deleted] = await db
      .delete(orderFormItemsTable)
      .where(eq(orderFormItemsTable.id, itemId))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Item not found" }); return; }
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

export default router;
