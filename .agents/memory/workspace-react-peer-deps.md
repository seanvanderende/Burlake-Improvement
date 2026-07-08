---
name: React peer deps in new pnpm workspace packages break tsc project-reference typecheck
description: A new workspace package that has React as a peer dependency needs an explicit "react": "catalog:" devDependency, or `tsc --build` across project references fails to resolve "react" even though the app runs fine at runtime via hoisting.
---

## Rule
When creating a new shared library package in the pnpm workspace (e.g. an object-storage-web helper package) that ships React components and declares `react` as a `peerDependency`, also add `"react": "catalog:"` under `devDependencies` in that package's `package.json`.

**Why:** pnpm's strict node_modules layout means a peer dependency alone isn't enough for TypeScript's `tsc --build` (project references) to resolve `react` when typechecking the package in isolation — it works at runtime because the consuming app hoists/dedupes React, but the isolated typecheck fails with "cannot find module react".

**How to apply:** Whenever `pnpm -w run typecheck:libs` (or a package-level `typecheck`) fails with "cannot find module 'react'" for a new internal package, check whether that package has `react` only as a peerDependency and add the matching `catalog:` devDependency entry.
