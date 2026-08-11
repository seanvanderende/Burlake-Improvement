import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, productPhotosTable } from "@workspace/db";

import { requireAdmin } from "../lib/adminAuth";
import { objectStorageService } from "./storage";

const router: IRouter = Router();

const WIX_PATTERN = /wixstatic\.com/i;

async function downloadImage(
  url: string,
): Promise<{ buf: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetch failed ${res.status} for ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  return { buf, contentType };
}

/**
 * Downloads a Wix-hosted image and re-uploads it into App Storage using the
 * same presigned-URL + ACL flow the rest of the app uses, so this works
 * unmodified against whichever database/storage bucket the running process
 * is actually connected to (dev or production).
 */
async function migrateOneImage(sourceUrl: string): Promise<string> {
  const { buf, contentType } = await downloadImage(sourceUrl);

  const uploadURL = await objectStorageService.getObjectEntityUploadURL();
  const putRes = await fetch(uploadURL, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buf,
  });
  if (!putRes.ok) {
    throw new Error(`upload failed ${putRes.status} for ${sourceUrl}`);
  }

  const rawPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
  await objectStorageService.trySetObjectEntityAclPolicy(rawPath, {
    owner: "admin",
    visibility: "public",
  });

  return `/api/storage${rawPath}`;
}

/**
 * One-time admin-triggered migration: moves any remaining Wix-hosted
 * (static.wixstatic.com) product images into App Storage. Runs against
 * whichever environment's database/storage the request hits, so triggering
 * it against production migrates production data using production's own
 * credentials -- no direct production DB/storage access from the workspace
 * is required.
 *
 * Safe to re-run: only rows still matching the Wix pattern are touched, and
 * each distinct source URL is only downloaded/uploaded once per run even if
 * reused by multiple products.
 */
router.post(
  "/admin/migrate-wix-images",
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    const migrated = new Map<string, string>();

    async function migrateUrl(url: string): Promise<string> {
      const cached = migrated.get(url);
      if (cached) return cached;
      const newUrl = await migrateOneImage(url);
      migrated.set(url, newUrl);
      return newUrl;
    }

    const products = await db
      .select({ id: productsTable.id, imageUrl: productsTable.imageUrl })
      .from(productsTable);
    const wixProducts = products.filter(
      (p) => p.imageUrl && WIX_PATTERN.test(p.imageUrl),
    );

    let productsDone = 0;
    let productsFailed = 0;
    const errors: Array<{ id: number; error: string }> = [];

    for (const p of wixProducts) {
      try {
        const newUrl = await migrateUrl(p.imageUrl as string);
        await db
          .update(productsTable)
          .set({ imageUrl: newUrl })
          .where(eq(productsTable.id, p.id));
        productsDone++;
      } catch (err) {
        productsFailed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ id: p.id, error: message });
        req.log.error({ err, productId: p.id }, "Failed to migrate product image");
      }
    }

    const photos = await db
      .select({ id: productPhotosTable.id, url: productPhotosTable.url })
      .from(productPhotosTable);
    const wixPhotos = photos.filter((p) => WIX_PATTERN.test(p.url));

    let photosDone = 0;
    let photosFailed = 0;

    for (const ph of wixPhotos) {
      try {
        const newUrl = await migrateUrl(ph.url);
        await db
          .update(productPhotosTable)
          .set({ url: newUrl })
          .where(eq(productPhotosTable.id, ph.id));
        photosDone++;
      } catch (err) {
        photosFailed++;
        req.log.error({ err, photoId: ph.id }, "Failed to migrate product photo");
      }
    }

    req.log.info(
      { productsDone, productsFailed, photosDone, photosFailed, uniqueImages: migrated.size },
      "Wix image migration complete",
    );

    res.json({
      productsFound: wixProducts.length,
      productsMigrated: productsDone,
      productsFailed,
      photosFound: wixPhotos.length,
      photosMigrated: photosDone,
      photosFailed,
      uniqueImagesMigrated: migrated.size,
      errors,
    });
  },
);

export default router;
