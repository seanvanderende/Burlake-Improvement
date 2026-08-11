---
name: Migrating bulk external images (Wix, etc.) into App Storage
description: How to move product/catalog images off a third-party CDN (e.g. Wix) into internally-hosted App Storage.
---

## Approach
Write a one-off Node script (run from `artifacts/api-server` so `@google-cloud/storage` resolves) that:
1. Queries the DB directly for rows whose image URL matches the external host pattern.
2. Downloads each image, uploads it into the private object dir via the GCS client (same sidecar-auth pattern as `objectStorage.ts`), and sets the `custom:aclPolicy` metadata to `visibility: public` directly (no need to go through the presigned-upload-URL/API round trip for a bulk migration).
3. Updates the DB row to the app's serving path (`/api/storage/objects/uploads/<uuid>`) — match whatever format existing upload code already stores, for consistency.

**Why:** there's no existing "bulk import into storage" tool; the presigned-URL flow is designed for one browser upload at a time, not a script migrating 100+ rows.

**How to apply:** dedupe by source URL (cache already-migrated URLs in a Map) before downloading — many product rows/photos across a catalog can point at the exact same source image, so this avoids wasteful duplicate downloads/uploads. Also handle any secondary "gallery" table (e.g. `product_photos`) alongside the primary image column — check both.

## Dependency note
`pg` was not a direct dependency of `artifacts/api-server` (it only used raw DB access via `@workspace/db`/drizzle). Added `pg` directly to `api-server`'s `package.json` so one-off migration scripts placed there can query the DB without needing to run from `lib/db` (which lacks `@google-cloud/storage`).
