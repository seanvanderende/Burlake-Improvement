import React, { useCallback, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import Papa from 'papaparse';
import { useBulkCreateProducts } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'upload' | 'preview' | 'done';

interface CsvRow {
  name: string;
  description: string;
  productImageUrl: string;
  collection: string;
  sku: string;
  visible: string;
}

interface MappedProduct {
  name: string;
  collectionNames: string[];
  description: string | null;
  imageUrl: string | null;
  sku: string | null;
  available: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build the Wix static image URL from a raw filename or existing URL. */
function buildImageUrl(raw: string): string | null {
  if (!raw) return null;
  const first = raw.split(';')[0].trim();
  if (!first) return null;
  if (first.startsWith('http')) return first;
  return `https://static.wixstatic.com/media/${first}`;
}

/** Parse a CSV row into a MappedProduct. Returns null if name or collections are missing. */
function parseRow(row: CsvRow): MappedProduct | null {
  const name = row.name?.trim();
  if (!name) return null;

  const collectionNames = row.collection
    ? row.collection.split(';').map((c) => c.trim()).filter(Boolean)
    : [];

  if (collectionNames.length === 0) return null;

  return {
    name,
    collectionNames,
    description: row.description?.trim() || null,
    imageUrl: buildImageUrl(row.productImageUrl || ''),
    sku: row.sku?.trim() || null,
    available: row.visible?.trim().toUpperCase() === 'TRUE',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminImport() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [mappedProducts, setMappedProducts] = useState<MappedProduct[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    duplicates: number;
    failed: number;
    errors: string[];
  } | null>(null);

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
          setParseError(
            `CSV is missing required columns: ${missing.join(', ')}. Expected columns: name, description, productImageUrl, collection, sku, visible.`,
          );
          return;
        }

        const data = results.data as CsvRow[];
        const parsed: MappedProduct[] = [];
        let skipped = 0;

        for (const row of data) {
          const product = parseRow(row);
          if (product) {
            parsed.push(product);
          } else {
            skipped++;
          }
        }

        setMappedProducts(parsed);
        setSkippedCount(skipped);
        setStep('preview');
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

  // ── Import ──────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    setStep('done');
    const CHUNK = 200;
    let created = 0;
    let duplicates = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < mappedProducts.length; i += CHUNK) {
      const chunk = mappedProducts.slice(i, i + CHUNK);
      try {
        const result = await bulkCreate.mutateAsync({ data: { products: chunk } });
        created += result.created;
        duplicates += result.duplicates;
        failed += result.failed;
        if (result.errors) errors.push(...result.errors);
      } catch (err: any) {
        failed += chunk.length;
        errors.push(err?.message ?? 'Unknown error');
      }
    }

    setImportResult({ created, duplicates, failed, errors });
  };

  // ── Unique collection names in the preview data ────────────────────────────

  const uniqueCollections = [
    ...new Set(mappedProducts.flatMap((p) => p.collectionNames)),
  ].sort();

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
            Upload a CSV export from your catalog to add products in bulk. Collections are created
            automatically from the CSV.
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['upload', 'preview', 'done'] as Step[]).map((s, i) => (
          <React.Fragment key={s}>
            {i > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground/40" />}
            <span
              className={
                step === s
                  ? 'text-foreground font-medium'
                  : ['done', 'preview'].indexOf(s) < ['done', 'preview'].indexOf(step)
                  ? 'text-muted-foreground line-through'
                  : 'text-muted-foreground'
              }
            >
              {s === 'upload' ? '1. Upload' : s === 'preview' ? '2. Preview' : '3. Done'}
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
            <p className="font-medium text-foreground mb-1">
              Drop your CSV here, or click to browse
            </p>
            <p className="text-muted-foreground text-sm">
              Expected columns:{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                name, description, productImageUrl, collection, sku, visible
              </code>
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              The <strong>collection</strong> column may contain multiple values separated by
              semicolons. Each value becomes a collection tag — new ones are created automatically.
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

      {/* ── Step 2: Preview ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border p-4 text-center">
              <div className="text-3xl font-serif text-foreground">{mappedProducts.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Products to import</div>
            </div>
            <div className="bg-card border border-border p-4 text-center">
              <div className="text-3xl font-serif text-foreground">{skippedCount}</div>
              <div className="text-sm text-muted-foreground mt-1">Rows skipped (no name/collection)</div>
            </div>
            <div className="bg-card border border-border p-4 text-center">
              <div className="text-3xl font-serif text-foreground">{uniqueCollections.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Unique collections</div>
            </div>
          </div>

          {uniqueCollections.length > 0 && (
            <div className="bg-muted/30 border border-border p-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Collections that will be created if new:</strong>{' '}
              {uniqueCollections.join(', ')}
            </div>
          )}

          {mappedProducts.length === 0 ? (
            <div className="flex gap-2 items-center text-muted-foreground bg-muted/30 p-4 rounded-md text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              No valid rows found. Make sure the CSV has <code>name</code> and{' '}
              <code>collection</code> columns with data.
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
                      <th className="px-4 py-2 text-left font-medium">Collections</th>
                      <th className="px-4 py-2 text-left font-medium">SKU</th>
                      <th className="px-4 py-2 text-left font-medium">In Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mappedProducts.slice(0, 20).map((p, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2 text-foreground font-medium truncate max-w-xs">
                          {p.name}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground text-xs">
                          {p.collectionNames.join(', ')}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground font-mono text-xs">
                          {p.sku || '—'}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`text-xs font-medium ${
                              p.available ? 'text-green-600' : 'text-muted-foreground'
                            }`}
                          >
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
            <Button
              variant="ghost"
              onClick={() => {
                setStep('upload');
                setMappedProducts([]);
                setParseError(null);
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              disabled={mappedProducts.length === 0 || bulkCreate.isPending}
              onClick={handleImport}
            >
              {bulkCreate.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing…
                </>
              ) : (
                <>Import {mappedProducts.length} Products</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
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
                <div className="space-y-1">
                  <p className="font-medium text-foreground text-lg">
                    {importResult.created} product{importResult.created !== 1 ? 's' : ''} imported
                    successfully
                  </p>
                  {importResult.duplicates > 0 && (
                    <p className="text-muted-foreground text-sm">
                      {importResult.duplicates} skipped — already in your catalog (matched by SKU or
                      name).
                    </p>
                  )}
                  {importResult.failed > 0 && (
                    <p className="text-sm text-destructive">
                      {importResult.failed} rows failed to insert.
                    </p>
                  )}
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {importResult.errors.slice(0, 5).map((e, i) => (
                        <li key={i} className="text-xs text-destructive font-mono">
                          {e}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setLocation('/admin')}>View Dashboard</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('upload');
                    setMappedProducts([]);
                    setSkippedCount(0);
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
