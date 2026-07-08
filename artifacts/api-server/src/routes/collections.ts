import { Router, type IRouter, type Request, type Response } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { db, collectionsTable, productCollectionsTable, productsTable } from "@workspace/db";
import {
  ListCollectionsQueryParams,
  ListCollectionsResponse,
  CreateCollectionBody,
  CreateCollectionResponse,
  UpdateCollectionParams,
  UpdateCollectionBody,
  UpdateCollectionResponse,
  DeleteCollectionParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

/** Slugify a collection name: lowercase, spaces/punctuation → hyphens */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Fetch all collections with product counts */
async function fetchCollectionsWithCounts(availableOnly?: boolean) {
  const rows = await db
    .select({
      id: collectionsTable.id,
      name: collectionsTable.name,
      slug: collectionsTable.slug,
      grp: collectionsTable.grp,
      sortOrder: collectionsTable.sortOrder,
      createdAt: collectionsTable.createdAt,
      updatedAt: collectionsTable.updatedAt,
      productCount: sql<number>`count(distinct ${productCollectionsTable.productId})::int`,
      availableCount: sql<number>`count(distinct case when ${productsTable.available} = true then ${productCollectionsTable.productId} end)::int`,
    })
    .from(collectionsTable)
    .leftJoin(
      productCollectionsTable,
      eq(collectionsTable.id, productCollectionsTable.collectionId),
    )
    .leftJoin(
      productsTable,
      eq(productCollectionsTable.productId, productsTable.id),
    )
    .groupBy(
      collectionsTable.id,
      collectionsTable.name,
      collectionsTable.slug,
      collectionsTable.grp,
      collectionsTable.sortOrder,
      collectionsTable.createdAt,
      collectionsTable.updatedAt,
    )
    .orderBy(asc(collectionsTable.sortOrder), asc(collectionsTable.name));

  return rows;
}

// ── Public: list all collections ─────────────────────────────────────────────

router.get("/collections", async (req: Request, res: Response): Promise<void> => {
  const query = ListCollectionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const collections = await fetchCollectionsWithCounts(query.data.availableOnly);
  res.json(ListCollectionsResponse.parse(collections));
});

// ── Admin: create ─────────────────────────────────────────────────────────────

router.post(
  "/admin/collections",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateCollectionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { name, slug: rawSlug, grp, sortOrder } = parsed.data;
    const slug = rawSlug?.trim() || slugify(name);

    const [collection] = await db
      .insert(collectionsTable)
      .values({ name, slug, grp: grp ?? null, sortOrder: sortOrder ?? 0 })
      .returning();

    const withCounts = { ...collection, productCount: 0, availableCount: 0 };
    res.status(201).json(CreateCollectionResponse.parse(withCounts));
  },
);

// ── Admin: update ─────────────────────────────────────────────────────────────

router.patch(
  "/admin/collections/:id",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const params = UpdateCollectionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateCollectionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) {
      updates.name = parsed.data.name;
      if (!parsed.data.slug) {
        updates.slug = slugify(parsed.data.name);
      }
    }
    if (parsed.data.slug !== undefined) updates.slug = parsed.data.slug;
    if (parsed.data.grp !== undefined) updates.grp = parsed.data.grp ?? null;
    if (parsed.data.sortOrder !== undefined) updates.sortOrder = parsed.data.sortOrder;

    const [collection] = await db
      .update(collectionsTable)
      .set(updates)
      .where(eq(collectionsTable.id, params.data.id))
      .returning();

    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    const withCounts = await fetchCollectionsWithCounts();
    const updated = withCounts.find((c) => c.id === collection.id);
    res.json(UpdateCollectionResponse.parse(updated ?? { ...collection, productCount: 0, availableCount: 0 }));
  },
);

// ── Admin: delete ─────────────────────────────────────────────────────────────

router.delete(
  "/admin/collections/:id",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const params = DeleteCollectionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [collection] = await db
      .delete(collectionsTable)
      .where(eq(collectionsTable.id, params.data.id))
      .returning();

    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }

    res.status(204).end();
  },
);

export { slugify };
export default router;
