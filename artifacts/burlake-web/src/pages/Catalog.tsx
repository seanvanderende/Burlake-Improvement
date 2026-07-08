import React, { useMemo, useState } from 'react';
import { useListProducts, useListCollections, useListProductSizes } from '@workspace/api-client-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';

// ── Filter section component ──────────────────────────────────────────────────

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border pb-4 mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

function FilterOption({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <Checkbox
        checked={checked}
        onCheckedChange={onChange}
        className="shrink-0"
      />
      <span className="text-sm text-foreground group-hover:text-primary transition-colors flex-1 leading-tight">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">{count}</span>
      )}
    </label>
  );
}

// ── Catalog page ──────────────────────────────────────────────────────────────

export default function Catalog() {
  // Always fetch available-only products — out-of-stock items are not shown
  const { data: allProducts = [], isLoading } = useListProducts({ availableOnly: true });
  const { data: collections = [] } = useListCollections();
  const { data: sizes = [] } = useListProductSizes();

  // ── Filter state ─────────────────────────────────────────────────────────────
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<number>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const toggleCollection = (id: number) =>
    setSelectedCollectionIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSize = (s: string) =>
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  const clearAll = () => {
    setSelectedCollectionIds(new Set());
    setSelectedSizes(new Set());
  };

  const hasFilters = selectedCollectionIds.size > 0 || selectedSizes.size > 0;

  // ── Group collections into filter sections ────────────────────────────────
  const byGroup = useMemo(() => {
    const map: Record<string, typeof collections> = {};
    for (const c of collections) {
      const key = c.grp ?? '__ungrouped__';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [collections]);

  // ── Client-side filtering ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      if (selectedCollectionIds.size > 0) {
        const productCollectionIds = new Set(p.collections.map((c) => c.id));
        const hasAny = [...selectedCollectionIds].some((id) => productCollectionIds.has(id));
        if (!hasAny) return false;
      }

      if (selectedSizes.size > 0) {
        if (!p.size || !selectedSizes.has(p.size)) return false;
      }

      return true;
    });
  }, [allProducts, selectedCollectionIds, selectedSizes]);

  // ── Sorted sizes: natural numeric sort ────────────────────────────────────
  const sortedSizes = useMemo(() => {
    return [...sizes].sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [sizes]);

  // ── Filter panel (shared between desktop sidebar and mobile drawer) ──────────
  const filterPanel = (
    <div className="space-y-0">
      {/* Category */}
      {byGroup['category'] && byGroup['category'].length > 0 && (
        <FilterSection title="Category">
          {byGroup['category'].map((col) => (
            <FilterOption
              key={col.id}
              label={col.name}
              count={col.availableCount}
              checked={selectedCollectionIds.has(col.id)}
              onChange={() => toggleCollection(col.id)}
            />
          ))}
        </FilterSection>
      )}

      {/* Pot Size */}
      {sortedSizes.length > 0 && (
        <FilterSection title="Pot Size">
          {sortedSizes.map((s) => (
            <FilterOption
              key={s}
              label={s}
              checked={selectedSizes.has(s)}
              onChange={() => toggleSize(s)}
            />
          ))}
        </FilterSection>
      )}

      {/* Holiday */}
      {byGroup['holiday'] && byGroup['holiday'].length > 0 && (
        <FilterSection title="Holiday">
          {byGroup['holiday'].map((col) => (
            <FilterOption
              key={col.id}
              label={col.name}
              count={col.availableCount}
              checked={selectedCollectionIds.has(col.id)}
              onChange={() => toggleCollection(col.id)}
            />
          ))}
        </FilterSection>
      )}
    </div>
  );

  const activeFilterCount = selectedCollectionIds.size + selectedSizes.size;

  return (
    <div className="bg-background pt-28 pb-24 min-h-screen">
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">

        {/* Page header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-3 font-semibold">
            <div className="w-8 h-px bg-primary" />
            Wholesale Catalog
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-[1.1]">
              Available to the Trade
            </h1>
            <div className="flex items-center gap-3">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear all filters
                </button>
              )}
              <span className="text-sm text-muted-foreground">
                {isLoading ? '…' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
              </span>
              {/* Mobile filter toggle */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobilePanelOpen((v) => !v)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {hasFilters && (
                  <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {[...selectedCollectionIds].map((id) => {
              const col = collections.find((c) => c.id === id);
              return col ? (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 text-xs bg-muted text-foreground border border-border px-2.5 py-1 cursor-pointer hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
                  onClick={() => toggleCollection(id)}
                >
                  {col.name} <X className="w-3 h-3" />
                </span>
              ) : null;
            })}
            {[...selectedSizes].map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 text-xs bg-muted text-foreground border border-border px-2.5 py-1 cursor-pointer hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
                onClick={() => toggleSize(s)}
              >
                {s} <X className="w-3 h-3" />
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-8 lg:gap-10 items-start">
          {/* ── Desktop sidebar ───────────────────────────────────────────── */}
          <aside className="hidden lg:block w-52 xl:w-60 shrink-0 sticky top-28">
            {filterPanel}
          </aside>

          {/* ── Mobile filter drawer ──────────────────────────────────────── */}
          {mobilePanelOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex">
              <div
                className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
                onClick={() => setMobilePanelOpen(false)}
              />
              <div className="relative z-10 ml-auto w-72 max-w-[85vw] h-full bg-background border-l border-border overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-serif text-xl">Filters</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobilePanelOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {filterPanel}
                <div className="mt-6 pt-4 border-t border-border flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      clearAll();
                      setMobilePanelOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button className="flex-1" onClick={() => setMobilePanelOpen(false)}>
                    Show {filtered.length}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Product grid ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-muted w-full mb-3"></div>
                    <div className="h-3.5 bg-muted w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-border bg-muted/20">
                <p className="text-muted-foreground font-light text-lg">
                  No products match your current filters.
                </p>
                <Button variant="outline" className="mt-6" onClick={clearAll}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
                {filtered.map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted mb-3 border border-border transition-all duration-300 group-hover:border-primary/50">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-serif text-base bg-secondary/5">
                          No Photo
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 truncate">
                        {product.collections.map((c) => c.name).join(' · ')}
                        {product.size ? ` · ${product.size}` : ''}
                      </div>
                      <h3 className="font-serif text-base leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
