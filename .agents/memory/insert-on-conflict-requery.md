---
name: INSERT ON CONFLICT DO NOTHING concurrency pattern
description: After onConflictDoNothing(), always re-query unresolved names; the INSERT RETURNING rows won't include conflicted ones.
---

## Rule
When auto-creating entities by name (e.g. collections in bulk import), use a two-phase approach:
1. INSERT ... ON CONFLICT DO NOTHING (no RETURNING).
2. Re-query ALL requested names to build the name→id map.

Never rely on `INSERT ... ON CONFLICT DO NOTHING RETURNING` to return IDs for conflicted rows — it only returns newly inserted rows.

**Why:** Under concurrent requests, a conflicted row (inserted by another request) won't appear in RETURNING, leaving the caller with no ID. The re-query reads whatever is now in the DB, regardless of who inserted it.

**How to apply:** See `ensureCollectionsByName()` in `artifacts/api-server/src/routes/products.ts` for the canonical pattern.
