---
name: api-server dev workflow requires manual restart
description: The api-server dev command is build-then-start, not a watcher; editing routes/lib files does not take effect until the workflow is restarted.
---

`artifacts/api-server`'s `dev` script is `pnpm run build && pnpm run start` — a one-shot
esbuild bundle followed by running the built `dist/index.mjs`. There is no file watcher.

**Why:** After editing route files or lib modules (e.g. adding a new Express route), the
running server keeps serving the old bundled code. New endpoints 404 and behavior changes
silently don't apply, even though `tsc --noEmit` typechecks cleanly and the source file is
correct. This already caused a wasted test cycle once (a newly-added POST route returned 404
purely because the workflow hadn't been restarted since the edit).

**How to apply:** Any change to `artifacts/api-server/src/**` requires
`WorkflowsRestart({ name: "artifacts/api-server: API Server" })` before testing/curling the
change — typechecking alone does not confirm the running server reflects the edit.
