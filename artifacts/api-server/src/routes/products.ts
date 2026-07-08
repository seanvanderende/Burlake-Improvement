import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, productsTable, type ProductCategory } from "@workspace/db";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  CreateProductBody,
  CreateProductResponse,
  GetCategorySummaryResponse,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  BulkCreateProductsBody,
  BulkCreateProductsResponse,
} from "@workspace/api-zod";

import { requireAdmin } from "../lib/adminAuth";
import { objectStorageService } from "./storage";

const router: IRouter = Router();

/**
 * Product photos are uploaded to the private object namespace, then marked
 * public here once actually attached to a product — the catalog is public,
 * so any image a product references must be publicly readable.
 */
async function markImagePublicIfOwned(imageUrl?: string | null): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith("/api/storage/objects/")) {
    return;
  }
  const rawPath = imageUrl.replace("/api/storage", "");
  await objectStorageService.trySetObjectEntityAclPolicy(rawPath, {
    owner: "admin",
    visibility: "public",
  });
}

router.get("/products", async (req: Request, res: Response): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category, availableOnly } = query.data;

  const conditions = [];
  if (category) {
    conditions.push(eq(productsTable.category, category));
  }
  if (availableOnly) {
    conditions.push(eq(productsTable.available, true));
  }

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(productsTable.sortOrder), asc(productsTable.name));

  res.json(ListProductsResponse.parse(products));
});

router.get(
  "/products/categories/summary",
  async (_req: Request, res: Response): Promise<void> => {
    const products = await db.select().from(productsTable);

    const CATEGORIES: ProductCategory[] = [
      "tropicals",
      "flowering",
      "planters",
      "easter",
      "mothers_day",
      "cut_flowers",
    ];

    const summary = CATEGORIES.map((category) => {
      const inCategory = products.filter((p) => p.category === category);
      return {
        category,
        total: inCategory.length,
        availableCount: inCategory.filter((p) => p.available).length,
      };
    });

    res.json(GetCategorySummaryResponse.parse(summary));
  },
);

router.post(
  "/products",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await markImagePublicIfOwned(parsed.data.imageUrl);

    const [product] = await db
      .insert(productsTable)
      .values(parsed.data)
      .returning();

    res.status(201).json(CreateProductResponse.parse(product));
  },
);

router.get("/products/:id", async (req: Request, res: Response): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, params.data.id));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse(product));
});

router.patch(
  "/products/:id",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const params = UpdateProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = UpdateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    await markImagePublicIfOwned(parsed.data.imageUrl);

    const [product] = await db
      .update(productsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(productsTable.id, params.data.id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(UpdateProductResponse.parse(product));
  },
);

router.post(
  "/admin/products/bulk",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = BulkCreateProductsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { products } = parsed.data;
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    // Insert in batches of 50 to avoid hitting DB parameter limits
    const BATCH = 50;
    for (let i = 0; i < products.length; i += BATCH) {
      const chunk = products.slice(i, i + BATCH);
      try {
        const rows = await db
          .insert(productsTable)
          .values(chunk.map((p) => ({ ...p, available: p.available ?? true })))
          .returning({ id: productsTable.id });
        created += rows.length;
      } catch (err: any) {
        failed += chunk.length;
        errors.push(err?.message ?? "Unknown error");
      }
    }

    res.json(BulkCreateProductsResponse.parse({ created, failed, errors }));
  },
);

router.delete(
  "/products/:id",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const params = DeleteProductParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [product] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, params.data.id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.status(204).end();
  },
);

export default router;
