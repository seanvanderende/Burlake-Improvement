/**
 * One-time migration: downloads every product image currently hosted on the
 * old Wix site (static.wixstatic.com) and re-uploads it into our own App
 * Storage bucket, then repoints `products.image_url` and
 * `product_photos.url` at the new internally-hosted copy.
 *
 * Run from artifacts/api-server so node_modules (pg, @google-cloud/storage)
 * resolve correctly:
 *   node migrate-images-to-storage.mjs
 *
 * Safe to re-run: any row whose URL no longer points at wixstatic.com is
 * skipped, and each distinct source URL is only downloaded/uploaded once
 * even if reused by multiple products.
 */

import { randomUUID } from 'crypto';
import pg from 'pg';
import { Storage } from '@google-cloud/storage';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';
const ACL_POLICY_METADATA_KEY = 'custom:aclPolicy';

const objectStorageClient = new Storage({
  credentials: {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: 'external_account',
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: { type: 'json', subject_token_field_name: 'access_token' },
    },
    universe_domain: 'googleapis.com',
  },
  projectId: '',
});

function getPrivateObjectDir() {
  const dir = process.env.PRIVATE_OBJECT_DIR || '';
  if (!dir) throw new Error('PRIVATE_OBJECT_DIR not set');
  return dir;
}

function parseObjectPath(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  const parts = path.split('/');
  if (parts.length < 3) throw new Error('Invalid path: must contain at least a bucket name');
  return { bucketName: parts[1], objectName: parts.slice(2).join('/') };
}

const WIX_PATTERN = /wixstatic\.com/i;

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buf, contentType };
}

/** Uploads one image to App Storage, marks it public, returns the app-facing URL. */
async function uploadToStorage(buf, contentType) {
  const privateObjectDir = getPrivateObjectDir();
  const objectId = randomUUID();
  const fullPath = `${privateObjectDir}/uploads/${objectId}`;
  const { bucketName, objectName } = parseObjectPath(fullPath);
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);

  await file.save(buf, { contentType, resumable: false });
  await file.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify({ owner: 'migration', visibility: 'public' }),
    },
  });

  return `/api/storage/objects/uploads/${objectId}`;
}

async function main() {
  // Cache by source URL so images reused across products are only migrated once.
  const migrated = new Map(); // wixUrl -> new internal URL

  async function migrateUrl(url) {
    if (migrated.has(url)) return migrated.get(url);
    const { buf, contentType } = await downloadImage(url);
    const newUrl = await uploadToStorage(buf, contentType);
    migrated.set(url, newUrl);
    return newUrl;
  }

  const { rows: products } = await pool.query(
    `SELECT id, image_url FROM products WHERE image_url ~* $1`,
    [WIX_PATTERN.source],
  );
  console.log(`Products with Wix images: ${products.length}`);

  let productsDone = 0;
  let productsFailed = 0;
  for (const p of products) {
    try {
      const newUrl = await migrateUrl(p.image_url);
      await pool.query('UPDATE products SET image_url = $1 WHERE id = $2', [newUrl, p.id]);
      productsDone++;
      if (productsDone % 20 === 0) console.log(`  ...${productsDone}/${products.length} products done`);
    } catch (err) {
      productsFailed++;
      console.error(`  ✗ product ${p.id} (${p.image_url}): ${err.message}`);
    }
  }

  const { rows: photos } = await pool.query(
    `SELECT id, url FROM product_photos WHERE url ~* $1`,
    [WIX_PATTERN.source],
  );
  console.log(`Product photos with Wix images: ${photos.length}`);

  let photosDone = 0;
  let photosFailed = 0;
  for (const ph of photos) {
    try {
      const newUrl = await migrateUrl(ph.url);
      await pool.query('UPDATE product_photos SET url = $1 WHERE id = $2', [newUrl, ph.id]);
      photosDone++;
    } catch (err) {
      photosFailed++;
      console.error(`  ✗ photo ${ph.id} (${ph.url}): ${err.message}`);
    }
  }

  console.log('\n✓ Migration complete');
  console.log(`  Products: ${productsDone} migrated, ${productsFailed} failed`);
  console.log(`  Photos:   ${photosDone} migrated, ${photosFailed} failed`);
  console.log(`  Unique images downloaded/uploaded: ${migrated.size}`);

  if (productsFailed > 0 || photosFailed > 0) process.exitCode = 1;
}

try {
  await main();
} finally {
  await pool.end();
}
