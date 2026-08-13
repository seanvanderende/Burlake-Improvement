import React, { useMemo, useState } from 'react';
import { useListProducts, useListCollections, useListProductSizes } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ChevronDown, ChevronUp, Search, SlidersHorizontal, X, Gift, Palette } from 'lucide-react';
import { Seo, JsonLd } from '@/components/Seo';
import { absoluteUrl } from '@/lib/seo';

// ── Filter section ────────────────────────────────────────────────────────────

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
    <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1a1a1a' }}>
          {title}
        </span>
        {open
          ? <ChevronUp style={{ width: 14, height: 14, color: '#6b7280' }} />
          : <ChevronDown style={{ width: 14, height: 14, color: '#6b7280' }} />}
      </button>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>}
    </div>
  );
}

// ── Filter option ─────────────────────────────────────────────────────────────

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
    <button
      type="button"
      onClick={onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
      }}
    >
      {/* Checkbox box */}
      <span
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          border: checked ? '2px solid #5a7a52' : '2px solid #9ca3af',
          backgroundColor: checked ? '#5a7a52' : '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: 14, color: '#374151', flex: 1, lineHeight: 1.3 }}>{label}</span>
      {count !== undefined && (
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{count}</span>
      )}
    </button>
  );
}

// ── Catalog page ──────────────────────────────────────────────────────────────

export default function Catalog() {
  const { data: allProducts = [], isLoading } = useListProducts();
  const { data: collections = [] } = useListCollections();
  const { data: sizes = [] } = useListProductSizes();

  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<number>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Out-of-stock items aren't shown in the public catalog at all.
  const inStockProducts = useMemo(() => allProducts.filter((p) => p.available), [allProducts]);

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
    setSearchQuery('');
  };

  const trimmedSearch = searchQuery.trim().toLowerCase();
  const hasFilters = selectedCollectionIds.size > 0 || selectedSizes.size > 0 || trimmedSearch !== '';
  const activeFilterCount = selectedCollectionIds.size + selectedSizes.size + (trimmedSearch ? 1 : 0);

  // Group collections by grp
  const byGroup = useMemo(() => {
    const map: Record<string, typeof collections> = {};
    for (const c of collections) {
      const key = c.grp ?? '__ungrouped__';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [collections]);

  // Collections come back from the API already ordered by sortOrder then name
  // (see /api/collections). Map each collection id to its position in that
  // order so products can be grouped by collection, using each product's
  // earliest-ordered collection when it belongs to more than one.
  const collectionRank = useMemo(() => {
    const map = new Map<number, number>();
    collections.forEach((c, i) => map.set(c.id, i));
    return map;
  }, [collections]);

  // A product's collections come back from the API in assignment order (the
  // order they were tagged), so the first entry is the collection it was
  // tagged with first. That collection's display order decides where the
  // product sits in the catalog when it belongs to more than one.
  const rankOf = (p: { collections: { id: number }[] }) => {
    const first = p.collections[0];
    if (!first) return Infinity;
    return collectionRank.get(first.id) ?? Infinity;
  };

  // Client-side filtering
  const filtered = useMemo(() => {
    const matches = inStockProducts.filter((p) => {
      if (selectedCollectionIds.size > 0) {
        const ids = new Set(p.collections.map((c) => c.id));
        if (![...selectedCollectionIds].some((id) => ids.has(id))) return false;
      }
      if (selectedSizes.size > 0) {
        if (!p.size || !selectedSizes.has(p.size)) return false;
      }
      if (trimmedSearch) {
        const hay = [
          p.name,
          (p as { sku?: string | null }).sku ?? '',
          (p as { description?: string | null }).description ?? '',
        ].join(' ').toLowerCase();
        if (!hay.includes(trimmedSearch)) return false;
      }
      return true;
    });

    // Default sort: grouped by collection order, alphabetical by name within
    // (and across) each group.
    return [...matches].sort((a, b) => {
      const rankDiff = rankOf(a) - rankOf(b);
      if (rankDiff !== 0) return rankDiff;
      // Plain lexicographic comparison, not localeCompare: many product names
      // start with a size mark using different quote characters (2", 2', 2.25"),
      // and ICU's locale-aware collation treats that punctuation as low-priority,
      // producing a non-alphabetical-looking order for this catalog's naming style.
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
  }, [inStockProducts, selectedCollectionIds, selectedSizes, trimmedSearch, collectionRank]);

  // Sizes actually present among products matching the current category/search
  // filters (size selection itself is excluded, so picking one size doesn't
  // hide the others). A size still shows if it's already selected, even with
  // zero matches, so an active filter never becomes impossible to clear.
  const sizesInScope = useMemo(() => {
    const inScope = inStockProducts.filter((p) => {
      if (selectedCollectionIds.size > 0) {
        const ids = new Set(p.collections.map((c) => c.id));
        if (![...selectedCollectionIds].some((id) => ids.has(id))) return false;
      }
      if (trimmedSearch) {
        const hay = [
          p.name,
          (p as { sku?: string | null }).sku ?? '',
          (p as { description?: string | null }).description ?? '',
        ].join(' ').toLowerCase();
        if (!hay.includes(trimmedSearch)) return false;
      }
      return true;
    });
    const set = new Set<string>();
    for (const p of inScope) {
      if (p.size) set.add(p.size);
    }
    return set;
  }, [inStockProducts, selectedCollectionIds, trimmedSearch]);

  const sortedSizes = useMemo(
    () => sizes
      .filter((s) => sizesInScope.has(s) || selectedSizes.has(s))
      .sort((a, b) => {
        const na = parseFloat(a), nb = parseFloat(b);
        return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
      }),
    [sizes, sizesInScope, selectedSizes],
  );

  const filterPanel = (
    <div>
      {/* Search input */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search varieties…"
            style={{
              width: '100%',
              padding: '6px 28px 6px 26px',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              fontSize: 13,
              color: '#1a1a1a',
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#9ca3af' }}
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </div>

      {byGroup['category']?.length > 0 && (
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

      {sortedSizes.length > 0 && (
        <FilterSection title="Pot Size">
          {sortedSizes.map((s) => (
            <FilterOption key={s} label={s} checked={selectedSizes.has(s)} onChange={() => toggleSize(s)} />
          ))}
        </FilterSection>
      )}

      {byGroup['holiday']?.length > 0 && (
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

  return (
    <div className="bg-background pt-28 pb-24 min-h-screen">
      <Seo
        title="Wholesale Plant Catalog"
        description="Browse Burnaby Lake Greenhouses' full wholesale range — tropical foliage, flowering plants, planters & upgrades, and cut flowers. Trade pricing available exclusively to retail partners."
        path="/catalog"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Burnaby Lake Greenhouses Wholesale Catalog',
          numberOfItems: filtered.length,
          itemListElement: filtered.slice(0, 100).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: absoluteUrl(`/product/${p.id}`),
            name: p.name,
          })),
        }}
      />
      <div className="max-w-[1440px] mx-auto px-6 md:px-10">

        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-3 font-semibold">
            <div className="w-8 h-px bg-primary" />
            Wholesale Catalog
          </span>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-[1.1]">
                Grown at Scale.{' '}
                <span className="italic font-light">Quality Guaranteed.</span>
              </h1>
              <p className="text-muted-foreground font-light mt-3 max-w-xl leading-relaxed">
                Over 65 years of growing expertise — held to the Western Canada quality standard
                your retail reputation is built on.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 text-xs uppercase tracking-wider border border-border px-3 py-2 hover:border-primary transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="hidden lg:inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear filters
                </button>
              )}
              <span className="text-sm text-muted-foreground">
                {isLoading ? '…' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        </div>

        {/* Active chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {trimmedSearch && (
              <span
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/30 px-2.5 py-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <Search className="w-3 h-3" />
                &ldquo;{searchQuery.trim()}&rdquo;
                <X className="w-3 h-3" />
              </span>
            )}
            {[...selectedCollectionIds].map((id) => {
              const col = collections.find((c) => c.id === id);
              return col ? (
                <span
                  key={id}
                  onClick={() => toggleCollection(id)}
                  className="inline-flex items-center gap-1.5 text-xs bg-muted text-foreground border border-border px-2.5 py-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  {col.name} <X className="w-3 h-3" />
                </span>
              ) : null;
            })}
            {[...selectedSizes].map((s) => (
              <span
                key={s}
                onClick={() => toggleSize(s)}
                className="inline-flex items-center gap-1.5 text-xs bg-muted text-foreground border border-border px-2.5 py-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                {s} <X className="w-3 h-3" />
              </span>
            ))}
          </div>
        )}

        {/* Layout: sidebar always visible */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>

          {/* Sidebar — desktop only; mobile uses the Filters drawer below */}
          <aside
            className="hidden lg:block"
            style={{ width: 210, minWidth: 210, flexShrink: 0, position: 'sticky', top: 112, background: '#f5f5f0', padding: '16px', borderRight: '1px solid #e5e7eb' }}
          >
            {filterPanel}
          </aside>

          {/* Product grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-muted w-full mb-3" />
                    <div className="h-3.5 bg-muted w-3/4 mb-2" />
                    <div className="h-3 bg-muted w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-border bg-muted/20">
                <p className="font-serif text-xl text-foreground mb-2">No varieties match those filters.</p>
                <p className="text-muted-foreground font-light">Try broadening your selection — our full range reflects over 65 years of curated growing.</p>
                <Button variant="outline" className="mt-6" onClick={clearAll}>Browse Full Range</Button>
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
                      {product.size && (
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 truncate">
                          {product.size}
                        </div>
                      )}
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

        {/* Supply & Value-Added Services */}
        <div className="mt-20 pt-16 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
                <div className="w-8 h-px bg-primary" />
                Supply &amp; Value-Added Services
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-secondary leading-[1.1] mb-6">
                Gift-ready, from ceramics to terra cotta.
              </h2>
              <div className="space-y-5 text-foreground/70 text-base font-light leading-relaxed">
                <p>
                  Beyond the plant itself, we offer container and packaging value-adds — from
                  ceramics and gift bags to baskets, tins, and terra cotta — so your order arrives
                  ready to sell.
                </p>
                <p>
                  Our in-house creative and design team builds fresh, custom looks for every
                  season and occasion, giving you volume-based options that stand out on the
                  shelf without extra work on your end.
                </p>
              </div>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto lg:mx-0">
                <div className="aspect-square bg-secondary/[0.04] border border-border flex items-center justify-center">
                  <Gift size={40} className="text-primary" strokeWidth={1.2} />
                </div>
                <div className="aspect-square bg-secondary/[0.04] border border-border flex items-center justify-center mt-10">
                  <Palette size={40} className="text-primary" strokeWidth={1.2} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm bg-background shadow-xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <span className="font-serif text-lg text-foreground">Filters</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {filterPanel}
            </div>
            <div className="flex-shrink-0 border-t border-border p-4 flex gap-3">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-4 py-3 text-xs uppercase tracking-wider border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1 bg-primary text-primary-foreground py-3 text-xs uppercase tracking-wider font-medium"
              >
                Show {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
