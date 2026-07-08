import React, { useCallback, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import Papa from 'papaparse';
import { useBulkCreateProducts } from '@workspace/api-client-react';
import { ProductCategory } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'upload' | 'map' | 'preview' | 'done';

interface CsvRow {
  name: string;
  description: string;
  productImageUrl: string;
  collection: string;
  sku: string;
  visible: string;
}

interface CollectionMapping {
  collection: string;
  count: number;
  category: ProductCategory | '__skip__';
}

interface MappedProduct {
  name: string;
  description: string | null;
  imageUrl: string | null;
  sku: string | null;
  available: boolean;
  category: ProductCategory;
}

// ─── Category helpers ─────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ProductCategory | '__skip__', string> = {
  tropicals: 'Tropical Foliage',
  flowering: 'Flowering Plants',
  planters: 'Planters & Upgrades',
  easter: 'Easter',
  mothers_day: "Mother's Day",
  cut_flowers: 'Cut Flowers & Bouquets',
  __skip__: '— Skip —',
};

const CATEGORIES: Array<ProductCategory | '__skip__'> = [
  'tropicals', 'flowering', 'planters', 'easter', 'mothers_day', 'cut_flowers', '__skip__',
];

/** Best-guess mapping from Wix collection names → our 6 categories */
const COLLECTION_DEFAULTS: Record<string, ProductCategory | '__skip__'> = {
  'Tropical Plants': 'tropicals',
  '4" pots': 'tropicals',
  '6" pots': 'tropicals',
  '8" pots': 'tropicals',
  '2.25" pots': 'tropicals',
  '1 Gallon pots': 'tropicals',
  '3gal pots': 'tropicals',
  '10" pots': 'tropicals',
  'Easy Growing': 'tropicals',
  'Plant Therapy': 'tropicals',
  'Cacti & Succulents': 'tropicals',
  'Desert Jewels': 'tropicals',
  'Ferns': 'tropicals',
  'Bulbs': 'tropicals',
  'Hanging Baskets': 'tropicals',
  '6" Lipstick Basket': 'tropicals',
  '6" Pothos Basket': 'tropicals',
  '8" Lipstick Basket': 'tropicals',
  '6" Hoya Basket': 'tropicals',
  '6" Pilea Basket': 'tropicals',
  '6" Spider Basket': 'tropicals',
  '6" Tradescantia Basket': 'tropicals',
  '8" Spider Basket': 'tropicals',
  '6" Philo Basket': 'tropicals',
  '8" Tradescantia Basket': 'tropicals',
  '8" Pilea Basket': 'tropicals',
  '8" Pothos Basket': 'tropicals',
  '6" Senecio Basket': 'tropicals',
  '8" Peperomia Basket': 'tropicals',
  '8" Philo Basket': 'tropicals',
  'Flowering Plants': 'flowering',
  "Valentine's Day": 'flowering',
  'Fall': 'flowering',
  'Spring Starters': 'flowering',
  "Nature's Beauty": 'flowering',
  'Christmas': 'flowering',
  'Christmas Greens': 'flowering',
  'Planters, Set Ins, and Novelties': 'planters',
  "Nature's Garden": 'planters',
  '8" planter': 'planters',
  '7" planter': 'planters',
  '6x11" planter': 'planters',
  '11x13" planter': 'planters',
  'Outdoor Items': 'planters',
  'Pet Pals': 'planters',
  'Unexpected Finds': 'planters',
  "Nature's Pantry": 'planters',
  'Easter': 'easter',
  "Mother's Day": 'mothers_day',
  'Cutflowers': 'cut_flowers',
};

function guessCategory(collection: string): ProductCategory | '__skip__' {
  if (!collection.trim()) return '__skip__';
  return COLLECTION_DEFAULTS[collection.trim()] ?? '__skip__';
}

/** Given a product's semicolon-separated collections and the user's mapping,
 *  return the first category that isn't __skip__, or null if all are skipped. */
function resolveCategory(
  collectionField: string,
  mapping: Record<string, ProductCategory | '__skip__'>,
): ProductCategory | null {
  const collections = collectionField.split(';').map((c) => c.trim()).filter(Boolean);
  for (const col of collections) {
    const cat = mapping[col];
    if (cat && cat !== '__skip__') return cat;
  }
  return null;
}

/** Build the Wix static image URL from a raw filename or existing URL. */
function buildImageUrl(raw: string): string | null {
  if (!raw) return null;
  // Take first image if multiple are semicolon-separated
  const first = raw.split(';')[0].trim();
  if (!first) return null;
  if (first.startsWith('http')) return first;
  return `https://static.wixstatic.com/media/${first}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminImport() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [collectionMappings, setCollectionMappings] = useState<CollectionMapping[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const [importResult, setImportResult] = useState<{ created: number; failed: number; errors: string[] } | null>(null);

  const bulkCreate = useBulkCreateProducts();

  // ── Step 1: parse CSV ──────────────────────────────────────────────────────

  const handleFile = useCallback((file: File) => {
    setParseError(null);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const required = ['name', 'collection'];
        const missing = required.filter((k) => !results.meta.fields?.includes(k));
        if (missing.length > 0) {
          setParseError(`CSV is missing required columns: ${missing.join(', ')}. Expected columns: name, description, productImageUrl, collection, sku, visible.`);
          return;
        }

        const data = results.data as CsvRow[];
        setRows(data);

        // Build the collection → count map
        const countMap = new Map<string, number>();
        for (const row of data) {
          for (const col of row.collection.split(';').map((c) => c.trim()).filter(Boolean)) {
            countMap.set(col, (countMap.get(col) ?? 0) + 1);
          }
        }

        const mappings: CollectionMapping[] = Array.from(countMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([col, count]) => ({
            collection: col,
            count,
            category: guessCategory(col),
          }));

        setCollectionMappings(mappings);
        setStep('map');
      },
      error: (err) => {
        setParseError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  // ── Step 2: mapping helpers ────────────────────────────────────────────────

  const updateMapping = (collection: string, category: ProductCategory | '__skip__') => {
    setCollectionMappings((prev) =>
      prev.map((m) => (m.collection === collection ? { ...m, category } : m)),
    );
  };

  // ── Step 3: compute preview ────────────────────────────────────────────────

  const mappingLookup = Object.fromEntries(
    collectionMappings.map((m) => [m.collection, m.category]),
  );

  const mappedProducts: MappedProduct[] = rows
    .map((row) => {
      const category = resolveCategory(row.collection, mappingLookup);
      if (!category) return null;
      return {
        name: row.name?.trim() || '',
        description: row.description?.trim() || null,
        imageUrl: buildImageUrl(row.productImageUrl),
        sku: row.sku?.trim() || null,
        available: row.visible?.trim().toUpperCase() === 'TRUE',
        category,
      } satisfies MappedProduct;
    })
    .filter((p): p is MappedProduct => p !== null && p.name.length > 0);

  const skippedCount = rows.length - mappedProducts.length;

  // ── Import ──────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    setStep('done');
    const CHUNK = 200;
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < mappedProducts.length; i += CHUNK) {
      const chunk = mappedProducts.slice(i, i + CHUNK);
      try {
        const result = await bulkCreate.mutateAsync({ data: { products: chunk } });
        created += result.created;
        failed += result.failed;
        if (result.errors) errors.push(...result.errors);
      } catch (err: any) {
        failed += chunk.length;
        errors.push(err?.message ?? 'Unknown error');
      }
    }

    setImportResult({ created, failed, errors });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-foreground">Bulk Import Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload a CSV export from your catalog to add products in bulk.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload', 'map', 'preview', 'done'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
            <span
              className={
                step === s
                  ? 'text-foreground font-medium'
                  : ['done', 'preview', 'map'].indexOf(s) < ['done', 'preview', 'map'].indexOf(step)
                  ? 'text-muted-foreground line-through'
                  : 'text-muted-foreground'
              }
            >
              {s === 'upload' ? '1. Upload' : s === 'map' ? '2. Map categories' : s === 'preview' ? '3. Preview' : '4. Done'}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-md p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium text-foreground mb-1">Drop your CSV here, or click to browse</p>
            <p className="text-muted-foreground text-sm">
              Expected columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">name, description, productImageUrl, collection, sku, visible</code>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>
          {parseError && (
            <div className="flex gap-2 items-start text-destructive bg-destructive/10 p-4 rounded-md text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Map collections ── */}
      {step === 'map' && (
        <div className="space-y-4">
          <div className="bg-muted/30 border border-border rounded-md p-4 text-sm text-muted-foreground">
            Parsed <strong className="text-foreground">{rows.length} products</strong> with{' '}
            <strong className="text-foreground">{collectionMappings.length} unique collections</strong>. 
            Assign each to one of your 6 categories, or skip it. Smart defaults are pre-filled — adjust any that are wrong.
          </div>

          <div className="bg-card border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Wix Collection</th>
                  <th className="px-4 py-3 text-left font-medium w-24">Products</th>
                  <th className="px-4 py-3 text-left font-medium">Map to category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {collectionMappings.map((m) => (
                  <tr key={m.collection} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{m.collection}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.count}</td>
                    <td className="px-4 py-3">
                      <select
                        value={m.category}
                        onChange={(e) => updateMapping(m.collection, e.target.value as ProductCategory | '__skip__')}
                        className={`text-sm border border-input rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs ${
                          m.category === '__skip__' ? 'text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setStep('preview')}>
              Continue to Preview <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 text-center">
              <div className="text-3xl font-serif text-foreground">{mappedProducts.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Products to import</div>
            </div>
            <div className="bg-card border border-border p-4 text-center">
              <div className="text-3xl font-serif text-foreground">{skippedCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Rows skipped</div>
            </div>
            <div className="bg-card border border-border p-4 text-center">
              <div className="text-3xl font-serif text-foreground">
                {mappedProducts.filter((p) => p.available).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Marked in-stock</div>
            </div>
          </div>

          {mappedProducts.length === 0 ? (
            <div className="flex gap-2 items-center text-muted-foreground bg-muted/30 p-4 rounded-md text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              All rows were skipped. Go back and assign at least one collection to a category.
            </div>
          ) : (
            <div className="bg-card border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border text-xs text-muted-foreground uppercase font-medium">
                Preview (first 20 rows)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Name</th>
                      <th className="px-4 py-2 text-left font-medium">Category</th>
                      <th className="px-4 py-2 text-left font-medium">SKU</th>
                      <th className="px-4 py-2 text-left font-medium">In Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mappedProducts.slice(0, 20).map((p, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2 text-foreground font-medium truncate max-w-xs">{p.name}</td>
                        <td className="px-4 py-2 text-muted-foreground">{CATEGORY_LABELS[p.category]}</td>
                        <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{p.sku || '—'}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs font-medium ${p.available ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {p.available ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappedProducts.length > 20 && (
                <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
                  … and {mappedProducts.length - 20} more
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep('map')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              disabled={mappedProducts.length === 0 || bulkCreate.isPending}
              onClick={handleImport}
            >
              {bulkCreate.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing…</>
              ) : (
                <>Import {mappedProducts.length} Products</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 'done' && (
        <div className="space-y-4">
          {!importResult ? (
            <div className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p>Importing products…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-card border border-border p-6 rounded-md">
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-foreground text-lg">
                    {importResult.created} product{importResult.created !== 1 ? 's' : ''} imported successfully
                  </p>
                  {importResult.failed > 0 && (
                    <p className="text-muted-foreground text-sm mt-1">
                      {importResult.failed} rows failed to insert.
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {importResult.errors.slice(0, 5).map((e, i) => (
                        <li key={i} className="text-xs text-destructive font-mono">{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setLocation('/admin')}>
                  View Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('upload');
                    setRows([]);
                    setCollectionMappings([]);
                    setImportResult(null);
                    setParseError(null);
                  }}
                >
                  Import Another File
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
