---
name: Drizzle-kit push non-interactive limitation
description: drizzle-kit push requires a TTY for any destructive schema change; workaround is a raw SQL migration script.
---

## Rule
Never rely on `drizzle-kit push` for destructive changes (DROP COLUMN, ADD UNIQUE) in CI / shell-exec contexts. It throws "Interactive prompts require a TTY terminal" and aborts.

**Why:** drizzle-kit push prompts for confirmation on data-loss statements and on suggestions like "do you want to truncate table to add unique constraint?" These prompts cannot be piped.

**How to apply:**
1. Write a one-shot `.mjs` migration script that does the destructive SQL directly via `pg.Pool`.
2. Run it with `node migrate-*.mjs`.
3. Then run `drizzle-kit push --force` for any remaining non-destructive changes (or skip it if tables already match).
4. Keep the migration script in `lib/db/` for reference; do not delete it.
