#!/usr/bin/env node
/**
 * Post-build SEO/GEO step.
 *
 * This is a pure Vite SPA — the shipped `dist/public/index.html` is an empty
 * `<div id="root">` shell filled in by client-side JS. Google can usually
 * execute that JS, but most AI crawlers (GPTBot, ClaudeBot, PerplexityBot,
 * etc.) fetch raw HTML and never run JavaScript, so they'd see nothing.
 *
 * This script runs after `vite build` and, for each key public route,
 * writes a real static HTML file: the same built shell (so hashed asset
 * URLs stay correct), a page-specific <title>/description/canonical/OG/
 * JSON-LD block, and a plain-HTML content snapshot inside #root. The React
 * app still boots normally on top of it for real visitors — this snapshot
 * only matters to crawlers that never run the JS.
 *
 * Product data is read directly from the database (not over HTTP) so this
 * works regardless of whether the API server happens to be running yet.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const distPublic = path.join(webRoot, 'dist', 'public');

const SITE_URL = 'https://burlake-improvement.replit.app';
const SITE_NAME = 'Burnaby Lake Greenhouses';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function absUrl(u) {
  if (!u) return u;
  return u.startsWith('http') ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`;
}

/** Replaces the <title>/description/OG block and injects extra <head> tags. */
function withHead(template, { title, description, path: routePath, image, jsonLdBlocks = [] }) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = `${SITE_URL}${routePath}`;
  const img = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : `${SITE_URL}/images/logo-horizontal.jpg`;

  let html = template
    .replace(/<title>.*?<\/title>/s, `<title>${esc(fullTitle)}</title>`)
    .replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(fullTitle)}" />`)
    .replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta property="og:type"[^>]*>/, `<meta property="og:type" content="website" />`)
    .replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(img)}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(fullTitle)}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(description)}" />`);

  const extraHead = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="en_CA" />`,
    ...jsonLdBlocks.map(jsonLd),
  ].join('\n    ');

  return html.replace('</head>', `    ${extraHead}\n  </head>`);
}

function withRootContent(template, innerHtml) {
  return template.replace(
    '<div id="root"></div>',
    `<div id="root">${innerHtml}</div>`,
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn('[build-seo-pages] DATABASE_URL is not set — skipping prerendered pages (static build only).');
    return;
  }

  const template = await readFile(path.join(distPublic, 'index.html'), 'utf8');

  // ── Load catalog data straight from the database (raw SQL — this script
  // runs as plain Node, not through the monorepo's TS build pipeline, so it
  // avoids importing @workspace/db's TypeScript sources directly) ─────────
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  const [productsRes, collectionsRes, photosRes, productCollectionsRes] = await Promise.all([
    pool.query('SELECT id, name, image_url AS "imageUrl", sku, size, description, available, sort_order AS "sortOrder" FROM products ORDER BY sort_order ASC'),
    pool.query('SELECT id, name, slug, grp, sort_order AS "sortOrder" FROM collections ORDER BY sort_order ASC'),
    pool.query('SELECT product_id AS "productId", url FROM product_photos ORDER BY sort_order ASC'),
    pool.query('SELECT product_id AS "productId", collection_id AS "collectionId" FROM product_collections'),
  ]);

  const allProducts = productsRes.rows;
  const allCollections = collectionsRes.rows;
  const allPhotos = photosRes.rows;
  const allProductCollections = productCollectionsRes.rows;

  const collectionsById = new Map(allCollections.map((c) => [c.id, c]));
  const photosByProduct = new Map();
  for (const p of allPhotos) {
    if (!photosByProduct.has(p.productId)) photosByProduct.set(p.productId, []);
    photosByProduct.get(p.productId).push(p.url);
  }
  const collectionsByProduct = new Map();
  for (const pc of allProductCollections) {
    if (!collectionsByProduct.has(pc.productId)) collectionsByProduct.set(pc.productId, []);
    const col = collectionsById.get(pc.collectionId);
    if (col) collectionsByProduct.get(pc.productId).push(col);
  }

  const availableProducts = allProducts.filter((p) => p.available);

  const routes = [];

  // ── Home ────────────────────────────────────────────────────────────
  routes.push({
    outPath: 'index.html',
    title: SITE_NAME,
    description:
      "Western Canada's leading wholesale greenhouse since 1955. Four generations of growing expertise, 1.3M+ sq ft under glass — supplying florists, grocers, and garden centers at scale.",
    path: '/',
    image: '/images/hero-greenhouse.jpg',
    jsonLdBlocks: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/images/logo-horizontal.jpg`,
        foundingDate: '1955',
        description:
          "Western Canada's leading wholesale greenhouse grower, supplying tropical foliage, flowering plants, planters, and cut flowers to retail trade partners since 1955.",
        address: { '@type': 'PostalAddress', addressLocality: 'Surrey', addressRegion: 'BC', addressCountry: 'CA' },
        areaServed: 'Western Canada',
      },
    ],
    body: `
      <h1>Burnaby Lake Greenhouses — Grown at Scale, Rooted in Tradition</h1>
      <p>Four generations of setting Western Canada's quality standard — grown at the scale your business demands. Since 1955, Burnaby Lake Greenhouses has supplied wholesale trade partners with tropical foliage, flowering plants, planters, and cut flowers.</p>
      <h2>Four generations of soil under our fingernails</h2>
      <p>What started over six decades ago as a modest family farm in Surrey, BC, has grown into one of the largest and most respected greenhouse operations in North America. The van der Ende family still walks the rows, inspects the crops, and ensures every plant meets a standard our retail partners stake their own reputations on.</p>
      <ul>
        <li>1.3M+ sq ft of greenhouse space</li>
        <li>100+ acres of growing area</li>
        <li>200+ full-time staff</li>
        <li>65+ years of growing expertise</li>
      </ul>
      <p>Exclusively wholesale. Browse the <a href="/catalog">full product catalog</a>, read our <a href="/history">company history</a>, learn about our <a href="/sustainability">sustainability practices</a>, or <a href="/contact">apply for a trade account</a>.</p>
    `,
  });

  // ── History ─────────────────────────────────────────────────────────
  routes.push({
    outPath: 'history/index.html',
    title: 'Our History — Four Generations of Growing',
    description:
      "From a single hobby farm in Burnaby in 1951 to 1.3 million square feet under glass in Cloverdale — the van der Ende family's 70+ year history growing Western Canada's wholesale plant supply.",
    path: '/history',
    body: `
      <h1>Our History — Four Generations, One Standard</h1>
      <p>From a single hobby farm in Burnaby to 1.3 million square feet under glass in Cloverdale — the van der Ende family has spent over 70 years growing quality Western Canada's trade can depend on.</p>
      <ul>
        <li><strong>1951</strong> — Herb van der Ende's family emigrated from Holland to Burnaby, BC.</li>
        <li><strong>1954</strong> — Burnaby Lake Greenhouses founded near Ledger Avenue and Canada Way, Burnaby.</li>
        <li><strong>1955</strong> — Incorporated as Burnaby Lake Greenhouses Ltd.</li>
        <li><strong>1961</strong> — Guildford, Surrey facility built; second generation joins the business.</li>
        <li><strong>1969–1977</strong> — Fleetwood, Surrey facility built and expanded.</li>
        <li><strong>1982–2004</strong> — Cloverdale facility begins; third generation joins.</li>
        <li><strong>2003–2005</strong> — Production consolidated in Cloverdale, expanded to 1.3M sq ft.</li>
        <li><strong>2010–Present</strong> — Fourth generation of van der Endes joins the operation.</li>
      </ul>
    `,
  });

  // ── Sustainability ──────────────────────────────────────────────────
  routes.push({
    outPath: 'sustainability/index.html',
    title: 'Growing Green — Sustainability Practices',
    description:
      'Water recycling, pot sterilizing, biodegradable materials, and efficient greenhouse technology — how Burnaby Lake Greenhouses reduces its environmental footprint while growing at scale.',
    path: '/sustainability',
    body: `
      <h1>Growing Green — Scaled Production, Smaller Footprint</h1>
      <p>We're always pursuing ways to increase our product output while maintaining our standard of quality — all while striving to minimize our environmental impact.</p>
      <h2>Water Recycling</h2>
      <p>Much of our facility recaptures irrigation water instead of losing it — filtered, pH-balanced, and cycled back into irrigation, cutting both water and fertilizer use significantly.</p>
      <h2>Pot Sterilizing</h2>
      <p>Natural materials are composted; intact plastic pots are steam-sterilized and reused for new crops, reducing plastic waste.</p>
      <h2>Biodegradable &amp; Recycled Materials</h2>
      <p>Where possible, we swap plastic for cardboard, paper shipping sleeves, bamboo stakes, and paperboard care labels.</p>
      <h2>Technology &amp; Efficiency</h2>
      <p>Natural gas boilers, roof-level shade and blackout curtains, computerized environmental controls, and one of North America's first Dutch rolling palletized benching systems enabling sub-irrigation.</p>
    `,
  });

  // ── Contact ─────────────────────────────────────────────────────────
  routes.push({
    outPath: 'contact/index.html',
    title: 'Apply for a Wholesale Account',
    description:
      'Apply for a wholesale trade account with Burnaby Lake Greenhouses. Open to established florists, grocers, and garden centers in Western Canada — 65+ years of growing expertise at scale.',
    path: '/contact',
    body: `
      <h1>Grown at Scale. Built for Trade.</h1>
      <p>For over 65 years, Western Canada's top florists, grocers, and garden centers have sourced from Burnaby Lake Greenhouses. Applications are open to established brick-and-mortar businesses in the floral, grocery, and garden trade.</p>
      <p>Location: Surrey, British Columbia (wholesale pickups by appointment only).</p>
    `,
  });

  // ── Catalog index ───────────────────────────────────────────────────
  const catalogListItems = availableProducts
    .slice(0, 500)
    .map((p) => `<li><a href="/product/${p.id}">${esc(p.name)}</a>${p.size ? ` — ${esc(p.size)}` : ''}</li>`)
    .join('\n');
  routes.push({
    outPath: 'catalog/index.html',
    title: 'Wholesale Plant Catalog',
    description:
      "Browse Burnaby Lake Greenhouses' full wholesale range — tropical foliage, flowering plants, planters & upgrades, and cut flowers. Trade pricing available exclusively to retail partners.",
    path: '/catalog',
    jsonLdBlocks: [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Burnaby Lake Greenhouses Wholesale Catalog',
        numberOfItems: availableProducts.length,
        itemListElement: availableProducts.slice(0, 200).map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE_URL}/product/${p.id}`,
          name: p.name,
        })),
      },
    ],
    body: `
      <h1>Wholesale Plant Catalog — Grown at Scale, Quality Guaranteed</h1>
      <p>Over 65 years of growing expertise — held to the Western Canada quality standard your retail reputation is built on. ${availableProducts.length} varieties currently available, including:</p>
      <ul>${catalogListItems}</ul>
    `,
  });

  // ── Individual product pages ───────────────────────────────────────
  for (const p of availableProducts) {
    const cols = collectionsByProduct.get(p.id) ?? [];
    const photos = [p.imageUrl, ...(photosByProduct.get(p.id) ?? [])].filter(Boolean);
    const description =
      p.description ||
      `${p.name}${p.size ? ` — ${p.size}` : ''}. Wholesale pricing available exclusively to Burnaby Lake Greenhouses' retail trade partners.`;

    routes.push({
      outPath: `product/${p.id}/index.html`,
      title: p.name,
      description: description.slice(0, 300),
      path: `/product/${p.id}`,
      image: p.imageUrl ?? undefined,
      jsonLdBlocks: [
        {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.name,
          description,
          sku: p.sku ?? undefined,
          image: photos.length > 0 ? photos.map(absUrl) : undefined,
          category: cols.length > 0 ? cols.map((c) => c.name).join(', ') : undefined,
          brand: { '@type': 'Brand', name: SITE_NAME },
          offers: {
            '@type': 'Offer',
            availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}/product/${p.id}`,
            priceCurrency: 'CAD',
            businessFunction: 'https://schema.org/Sell',
            eligibleCustomerType: 'https://schema.org/Reseller',
          },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Catalog', item: `${SITE_URL}/catalog` },
            { '@type': 'ListItem', position: 3, name: p.name, item: `${SITE_URL}/product/${p.id}` },
          ],
        },
      ],
      body: `
        <h1>${esc(p.name)}</h1>
        ${cols.length > 0 ? `<p>Category: ${cols.map((c) => esc(c.name)).join(', ')}</p>` : ''}
        ${p.sku ? `<p>SKU: ${esc(p.sku)}</p>` : ''}
        ${p.size ? `<p>Size: ${esc(p.size)}</p>` : ''}
        ${!p.available ? '<p>Currently out of stock.</p>' : ''}
        <p>${esc(description)}</p>
        ${photos[0] ? `<img src="${esc(absUrl(photos[0]))}" alt="${esc(p.name)}" />` : ''}
        <p>Wholesale pricing is available exclusively to Burnaby Lake Greenhouses' retail trade partners. <a href="/contact">Request a quote</a>.</p>
        <p><a href="/catalog">Back to full catalog</a></p>
      `,
    });
  }

  // ── Write all route files ──────────────────────────────────────────
  for (const route of routes) {
    const html = withRootContent(
      withHead(template, route),
      route.body,
    );
    const outFile = path.join(distPublic, route.outPath);
    await mkdir(path.dirname(outFile), { recursive: true });
    await writeFile(outFile, html, 'utf8');
  }

  // ── Sitemap ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes.map((r) => ({ loc: `${SITE_URL}${r.path}`, priority: r.path === '/' ? '1.0' : r.path.startsWith('/product/') ? '0.6' : '0.8' }));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n')}\n</urlset>\n`;
  await writeFile(path.join(distPublic, 'sitemap.xml'), sitemap, 'utf8');

  console.log(`[build-seo-pages] Wrote ${routes.length} prerendered pages + sitemap.xml (${availableProducts.length} products).`);

  await pool.end();
}

main().catch((err) => {
  console.error('[build-seo-pages] Failed:', err);
  process.exitCode = 1;
});
