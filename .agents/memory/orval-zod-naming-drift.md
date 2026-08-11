---
name: Orval/zod codegen naming convention can drift over time
description: Restoring old deleted route code that references schema-name-based zod exports may fail to compile if the project has since switched to operation-based naming.
---

This project's orval codegen (`lib/api-spec` → `lib/api-client-react` / `lib/api-zod`) generated
schema-name-based exports early on (e.g. an OpenAPI schema named `PageViewInput` produced a zod
const `PageViewInput`). At some point the generated naming convention shifted to operation-based
exports instead (e.g. `POST /analytics/pageview` now generates `RecordPageViewBody`, and
`GET /admin/analytics/summary` generates `GetAnalyticsSummaryResponse`), regardless of the
underlying schema names in `openapi.yaml`.

**Why:** When restoring a previously-deleted feature (via git history) that references the old
schema-name-based zod exports, the code will fail to typecheck after re-running codegen, because
the generated names no longer match. This is easy to miss because the OpenAPI schema names
themselves (`PageViewInput`, `AnalyticsSummary`) are unchanged — only the generated zod binding
names differ.

**How to apply:** After running `pnpm --filter @workspace/api-spec run codegen` for any restored
or old route code, check the actual generated names in `lib/api-zod`/`lib/api-client-react`
(grep for the operationId or route) rather than assuming the old import names still work. Update
route code to use the current operation-based names.
