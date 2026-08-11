---
name: SPA SEO prerendering for burlake-web
description: How and why burlake-web (client-only Vite SPA) generates static crawlable HTML for AI/search crawlers at build time.
---

burlake-web is a pure client-rendered Vite SPA with no SSR — `dist/public/index.html` ships as an empty `<div id="root">` shell. Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) don't execute JavaScript, so they saw nothing without extra work; Google can usually run the JS but even it benefits from real HTML.

**Solution:** `artifacts/burlake-web/scripts/build-seo-pages.mjs` runs after `vite build` (chained in the `build` npm script) and writes real static HTML files for each route (home, history, sustainability, catalog, contact, and one per product) by cloning the freshly-built `index.html` template (so hashed asset URLs stay correct) and swapping in page-specific title/meta/OG/canonical tags, JSON-LD, and a plain-HTML content snapshot inside `#root`. The real React app still boots normally on top for real visitors (`createRoot`, not hydration, so no mismatch risk). Also generates `sitemap.xml`.

**Why raw `pg` instead of `@workspace/db`:** the script runs as plain `node scripts/*.mjs`, not through the monorepo's TS build pipeline — importing `@workspace/db`'s raw TypeScript source directly fails with `ERR_UNSUPPORTED_DIR_IMPORT` (Node's ESM loader can't resolve extension-less TS directory imports). Query the `products`/`collections`/`product_photos`/`product_collections` tables directly via `pg.Pool` instead.

**Why not react-helmet-async:** React 19 natively hoists `<title>`, `<meta>`, and `<link>` tags rendered anywhere in the component tree into `<head>`, both client-side and in any future SSR — a plain custom `Seo`/`JsonLd` component with native tags is sufficient, no extra dependency needed.

**How to apply:** if adding a new public route/page to burlake-web, add a matching `<Seo>`/`JsonLd` block to the React page component (for real visitors and Google) AND a corresponding entry in `build-seo-pages.mjs`'s `routes` array (for non-JS crawlers) — the two are hand-kept in sync, not derived from one source.
