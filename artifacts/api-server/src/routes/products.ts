import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
  db,
  productsTable,
  collectionsTable,
  productCollectionsTable,
  productPhotosTable,
} from "@workspace/db";
import {
  ListProductsQueryParams,
  ListProductsResponse,
  ListProductSizesResponse,
  CreateProductBody,
  CreateProductResponse,
  GetProductParams,
  GetProductResponse,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  BulkCreateProductsBody,
  BulkCreateProductsResponse,
  BulkDeleteProductsBody,
  BulkDeleteProductsResponse,
} from "@workspace/api-zod";

import { requireAdmin } from "../lib/adminAuth";
import { objectStorageService } from "./storage";
import { slugify } from "./collections";

const router: IRouter = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch the collection rows for a set of product IDs, returned as a Map
 * keyed by productId. One DB round-trip for any number of products.
 */
async function getCollectionsByProduct(
  productIds: number[],
): Promise<Map<number, { id: number; name: string; slug: string }[]>> {
  const map = new Map<number, { id: number; name: string; slug: string }[]>();
  if (productIds.length === 0) return map;

  const links = await db
    .select({
      productId: productCollectionsTable.productId,
      id: collectionsTable.id,
      name: collectionsTable.name,
      slug: collectionsTable.slug,
    })
    .from(productCollectionsTable)
    .innerJoin(
      collectionsTable,
      eq(productCollectionsTable.collectionId, collectionsTable.id),
    )
    .where(inArray(productCollectionsTable.productId, productIds))
    // Order by assignment time so the first item in each product's
    // collections array is the collection it was tagged with first — used
    // as the catalog's tie-break when a product belongs to several.
    .orderBy(asc(productCollectionsTable.createdAt));

  for (const link of links) {
    if (!map.has(link.productId)) map.set(link.productId, []);
    map.get(link.productId)!.push({ id: link.id, name: link.name, slug: link.slug });
  }

  return map;
}

/**
 * Replace a product's collection memberships in a single transaction.
 */
async function setProductCollections(
  productId: number,
  collectionIds: number[],
): Promise<void> {
  await db
    .delete(productCollectionsTable)
    .where(eq(productCollectionsTable.productId, productId));

  if (collectionIds.length > 0) {
    await db
      .insert(productCollectionsTable)
      .values(collectionIds.map((collectionId) => ({ productId, collectionId })));
  }
}

/**
 * Ensure all named collections exist, creating any that are new.
 * Returns a Map from name → id.
 *
 * Concurrency-safe: after the INSERT … ON CONFLICT DO NOTHING we re-query
 * any names that were not returned (i.e. a concurrent request created them)
 * so every requested name always resolves to an ID.
 */
async function ensureCollectionsByName(
  names: string[],
): Promise<Map<string, number>> {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const existing = await db
    .select({ id: collectionsTable.id, name: collectionsTable.name })
    .from(collectionsTable)
    .where(inArray(collectionsTable.name, unique));

  const byName = new Map(existing.map((c) => [c.name, c.id]));

  const toCreate = unique.filter((n) => !byName.has(n));
  if (toCreate.length > 0) {
    // Insert new collections — concurrent requests may have already created
    // some, so we use ON CONFLICT DO NOTHING and then re-query all.
    await db
      .insert(collectionsTable)
      .values(toCreate.map((name) => ({ name, slug: slugify(name) })))
      .onConflictDoNothing();

    // Re-read all names that were not already in the map (covers both newly
    // inserted rows and any that were concurrently inserted and thus skipped).
    const afterInsert = await db
      .select({ id: collectionsTable.id, name: collectionsTable.name })
      .from(collectionsTable)
      .where(inArray(collectionsTable.name, toCreate));

    for (const c of afterInsert) byName.set(c.name, c.id);
  }

  return byName;
}

/**
 * Mark a product image as publicly readable once it's attached to a product.
 */
async function markImagePublicIfOwned(imageUrl?: string | null): Promise<void> {
  if (!imageUrl || !imageUrl.startsWith("/api/storage/objects/")) return;
  const rawPath = imageUrl.replace("/api/storage", "");
  await objectStorageService.trySetObjectEntityAclPolicy(rawPath, {
    owner: "admin",
    visibility: "public",
  });
}

/**
 * Fetch a product's additional gallery photos (beyond the primary imageUrl),
 * in display order, for a set of product IDs. Returned as a Map keyed by
 * productId → ordered url list.
 */
async function getPhotosByProduct(
  productIds: number[],
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (productIds.length === 0) return map;

  const rows = await db
    .select({
      productId: productPhotosTable.productId,
      url: productPhotosTable.url,
    })
    .from(productPhotosTable)
    .where(inArray(productPhotosTable.productId, productIds))
    .orderBy(asc(productPhotosTable.sortOrder), asc(productPhotosTable.id));

  for (const row of rows) {
    if (!map.has(row.productId)) map.set(row.productId, []);
    map.get(row.productId)!.push(row.url);
  }

  return map;
}

/**
 * Replace a product's gallery photos with the given ordered list, marking
 * any newly-added ones public. Skipped when `photoUrls` is undefined (no
 * change requested).
 */
async function setProductPhotos(
  productId: number,
  photoUrls: string[] | undefined,
): Promise<void> {
  if (photoUrls === undefined) return;

  await Promise.all(photoUrls.map((url) => markImagePublicIfOwned(url)));

  await db.delete(productPhotosTable).where(eq(productPhotosTable.productId, productId));

  if (photoUrls.length > 0) {
    await db.insert(productPhotosTable).values(
      photoUrls.map((url, index) => ({ productId, url, sortOrder: index })),
    );
  }
}

// ─── Public routes ────────────────────────────────────────────────────────────

// Must be registered before /products/:id to avoid "sizes" being parsed as an id
router.get("/products/sizes", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .selectDistinct({ size: productsTable.size })
    .from(productsTable)
    .orderBy(asc(productsTable.size));

  const sizes = rows
    .map((r) => r.size)
    .filter((s): s is string => s !== null && s.trim() !== "");

  res.json(ListProductSizesResponse.parse(sizes));
});

router.get("/products", async (req: Request, res: Response): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { collectionId, size, availableOnly } = query.data;

  let productIds: number[] | null = null;

  // Filter by collection: get IDs of products in that collection first
  if (collectionId) {
    const rows = await db
      .select({ productId: productCollectionsTable.productId })
      .from(productCollectionsTable)
      .where(eq(productCollectionsTable.collectionId, collectionId));

    productIds = rows.map((r) => r.productId);
    if (productIds.length === 0) {
      res.json([]);
      return;
    }
  }

  const conditions = [];
  if (productIds) conditions.push(inArray(productsTable.id, productIds));
  if (availableOnly) conditions.push(eq(productsTable.available, true));
  if (size) conditions.push(eq(productsTable.size, size));

  const products = await db
    .select()
    .from(productsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(productsTable.sortOrder), asc(productsTable.name));

  const resultProductIds = products.map((p) => p.id);
  const [collectionMap, photosMap] = await Promise.all([
    getCollectionsByProduct(resultProductIds),
    getPhotosByProduct(resultProductIds),
  ]);

  const result = products.map((p) => ({
    ...p,
    collections: collectionMap.get(p.id) ?? [],
    photos: photosMap.get(p.id) ?? [],
  }));

  res.json(ListProductsResponse.parse(result));
});

router.get(
  "/products/:id",
  async (req: Request, res: Response): Promise<void> => {
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

    const [collectionMap, photosMap] = await Promise.all([
      getCollectionsByProduct([product.id]),
      getPhotosByProduct([product.id]),
    ]);
    res.json(
      GetProductResponse.parse({
        ...product,
        collections: collectionMap.get(product.id) ?? [],
        photos: photosMap.get(product.id) ?? [],
      }),
    );
  },
);

// ─── Admin routes ─────────────────────────────────────────────────────────────

router.post(
  "/products",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { collectionIds, photoUrls, ...productData } = parsed.data;
    await markImagePublicIfOwned(productData.imageUrl);

    const [product] = await db
      .insert(productsTable)
      .values(productData)
      .returning();

    await Promise.all([
      setProductCollections(product.id, collectionIds),
      setProductPhotos(product.id, photoUrls),
    ]);

    const [collectionMap, photosMap] = await Promise.all([
      getCollectionsByProduct([product.id]),
      getPhotosByProduct([product.id]),
    ]);
    res.status(201).json(
      CreateProductResponse.parse({
        ...product,
        collections: collectionMap.get(product.id) ?? [],
        photos: photosMap.get(product.id) ?? [],
      }),
    );
  },
);

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

    const { collectionIds, photoUrls, ...productData } = parsed.data;
    await markImagePublicIfOwned(productData.imageUrl);

    const [product] = await db
      .update(productsTable)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(productsTable.id, params.data.id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await Promise.all([
      collectionIds !== undefined ? setProductCollections(product.id, collectionIds) : Promise.resolve(),
      setProductPhotos(product.id, photoUrls),
    ]);

    const [collectionMap, photosMap] = await Promise.all([
      getCollectionsByProduct([product.id]),
      getPhotosByProduct([product.id]),
    ]);
    res.json(
      UpdateProductResponse.parse({
        ...product,
        collections: collectionMap.get(product.id) ?? [],
        photos: photosMap.get(product.id) ?? [],
      }),
    );
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

    // Pre-load / auto-create all named collections in one pass
    const allNames = [...new Set(products.flatMap((p) => p.collectionNames))];
    const collectionByName = await ensureCollectionsByName(allNames);

    // Rows with a SKU that already exists are updated in place rather than
    // skipped or duplicated. Rows without a SKU still fall back to a
    // name-match duplicate check, since there's no stable key to update on.
    const incomingSkus = products.map((p) => p.sku).filter((s): s is string => Boolean(s));
    const incomingNames = products.filter((p) => !p.sku).map((p) => p.name);

    const [existingBySku, existingByName] = await Promise.all([
      incomingSkus.length > 0
        ? db
            .select({ id: productsTable.id, sku: productsTable.sku })
            .from(productsTable)
            .where(inArray(productsTable.sku, incomingSkus))
        : Promise.resolve([] as { id: number; sku: string | null }[]),
      incomingNames.length > 0
        ? db
            .select({ name: productsTable.name })
            .from(productsTable)
            .where(inArray(productsTable.name, incomingNames))
        : Promise.resolve([] as { name: string }[]),
    ]);

    const existingIdBySku = new Map(
      existingBySku.filter((r) => r.sku !== null).map((r) => [r.sku as string, r.id]),
    );
    const existingNameSet = new Set(existingByName.map((r) => r.name));

    let duplicates = 0;
    let failed = 0;
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    const toInsert: typeof products = [];
    const toUpdate: { id: number; product: (typeof products)[number] }[] = [];

    for (const p of products) {
      if (p.sku && existingIdBySku.has(p.sku)) {
        toUpdate.push({ id: existingIdBySku.get(p.sku)!, product: p });
      } else if (!p.sku && existingNameSet.has(p.name)) {
        duplicates++;
      } else {
        toInsert.push(p);
      }
    }

    const BATCH = 50;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const chunk = toInsert.slice(i, i + BATCH);
      try {
        const inserted = await db
          .insert(productsTable)
          .values(
            chunk.map(({ collectionNames: __, ...p }) => ({
              ...p,
              available: p.available ?? true,
            })),
          )
          .returning({ id: productsTable.id });

        // Link each inserted product to its collections
        const junctionRows = inserted.flatMap((row, idx) => {
          const names = chunk[idx].collectionNames;
          return names
            .map((name) => collectionByName.get(name))
            .filter((id): id is number => id !== undefined)
            .map((collectionId) => ({ productId: row.id, collectionId }));
        });

        if (junctionRows.length > 0) {
          await db.insert(productCollectionsTable).values(junctionRows);
        }

        created += inserted.length;
      } catch (err: any) {
        failed += chunk.length;
        errors.push(err?.message ?? "Unknown error");
      }
    }

    for (const { id, product } of toUpdate) {
      try {
        const { collectionNames, ...rest } = product;
        await db
          .update(productsTable)
          .set({ ...rest, available: rest.available ?? true, updatedAt: new Date() })
          .where(eq(productsTable.id, id));

        const collectionIds = collectionNames
          .map((name) => collectionByName.get(name))
          .filter((cid): cid is number => cid !== undefined);
        await setProductCollections(id, collectionIds);

        updated++;
      } catch (err: any) {
        failed++;
        errors.push(err?.message ?? "Unknown error");
      }
    }

    res.json(BulkCreateProductsResponse.parse({ created, updated, duplicates, failed, errors }));
  },
);

router.post(
  "/admin/products/bulk-delete",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = BulkDeleteProductsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { ids } = parsed.data;
    const deleted = await db
      .delete(productsTable)
      .where(inArray(productsTable.id, ids))
      .returning({ id: productsTable.id });

    res.json(BulkDeleteProductsResponse.parse({ deleted: deleted.length }));
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
