/**
 * Portal ACL backfill: ensures all brochure and price-list objects are set to
 * private ACL so they can only be accessed through the portal-gated download
 * proxy routes.
 *
 * Called automatically at server startup (idempotent — skips objects that are
 * already private or not found in object storage).
 */

import { db, brochuresTable, priceListsTable } from "@workspace/db";
import { objectStorageService } from "../routes/storage";
import { Logger } from "pino";

export async function runPortalAclBackfill(log: Logger): Promise<void> {
  try {
    const brochureRows = await db
      .select({ id: brochuresTable.id, objectPath: brochuresTable.objectPath })
      .from(brochuresTable);
    const priceRows = await db
      .select({ id: priceListsTable.id, objectPath: priceListsTable.objectPath })
      .from(priceListsTable);

    const rows = [...brochureRows, ...priceRows];
    if (rows.length === 0) {
      log.info("Portal ACL backfill: no documents found, nothing to do");
      return;
    }

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

    if (errors.length > 0) {
      log.warn(
        { errors },
        `Portal ACL backfill: ${updated} set private, ${skipped} not found, ${errors.length} errors`,
      );
    } else {
      log.info(
        `Portal ACL backfill: ${updated} set private, ${skipped} not found in storage`,
      );
    }
  } catch (err) {
    // Non-fatal: log and continue. Portal download proxy routes still gate access.
    log.error({ err }, "Portal ACL backfill failed — continuing server startup");
  }
}
