import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  useListProducts,
  useDeleteProduct,
  useUpdateProduct,
  useBulkDeleteProducts,
  useListCollections,
  getListProductsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Upload, Download, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [filterCollectionId, setFilterCollectionId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Clear selection when filters change to avoid hidden selections
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterCollectionId, searchQuery]);

  const { data: collections } = useListCollections();

  const collectionId =
    filterCollectionId !== 'all' ? parseInt(filterCollectionId, 10) : undefined;

  const { data: products, isLoading } = useListProducts({ collectionId });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
    },
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: (_data, variables) => {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(variables.id);
          return next;
        });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
    },
  });

  const bulkDelete = useBulkDeleteProducts({
    mutation: {
      onSuccess: () => {
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      },
    },
  });

  const handleToggleAvailable = (id: number, currentStatus: boolean) => {
    updateProduct.mutate({ id, data: { available: !currentStatus } });
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      deleteProduct.mutate({ id });
    }
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (window.confirm(`Delete ${count} selected product${count !== 1 ? 's' : ''}? This cannot be undone.`)) {
      bulkDelete.mutate({ data: { ids: Array.from(selectedIds) } });
    }
  };

  // ── CSV export ───────────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    // Fetch all products (unfiltered) from the query cache or re-use current data
    const allProducts =
      queryClient.getQueryData<typeof products>(getListProductsQueryKey()) ?? products ?? [];

    if (!allProducts.length) {
      alert('No products to export.');
      return;
    }

    const headers = ['name', 'sku', 'size', 'description', 'available', 'sortOrder', 'collections', 'imageUrl'];

    const escape = (v: string | null | undefined) => {
      const s = v == null ? '' : String(v);
      // Wrap in quotes if the value contains commas, quotes, or newlines
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = allProducts.map((p) => [
      escape(p.name),
      escape(p.sku),
      escape(p.size),
      escape(p.description),
      String(p.available),
      String(p.sortOrder),
      escape(p.collections.map((c) => c.name).join('; ')),
      escape(p.imageUrl),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `burlake-products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredProducts = products?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const allVisibleIds = filteredProducts?.map((p) => p.id) ?? [];
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const someSelected = allVisibleIds.some((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allVisibleIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Products Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage catalog and weekly availability</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportCsv} disabled={!products?.length}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => setLocation('/admin/import')}>
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <Button onClick={() => setLocation('/admin/products/new')}>
            <Plus className="w-4 h-4 mr-2" /> New Product
          </Button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="bg-card border border-border flex flex-col md:flex-row items-center gap-4 p-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-transparent border-0 border-b border-input rounded-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterCollectionId}
            onChange={(e) => setFilterCollectionId(e.target.value)}
            className="bg-transparent border-b border-input py-2 text-sm focus:outline-none cursor-pointer w-full md:w-56"
          >
            <option value="all">All Collections</option>
            {(collections ?? []).map((col) => (
              <option key={col.id} value={String(col.id)}>
                {col.name} ({col.productCount})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm">
          <span className="text-destructive font-medium">
            {selectedIds.size} product{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDelete.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {bulkDelete.isPending ? 'Deleting…' : `Delete ${selectedIds.size} selected`}
          </Button>
        </div>
      )}

      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-4 w-10">
                  <Checkbox
                    checked={someSelected && !allSelected ? 'indeterminate' : allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Collections</th>
                <th className="px-6 py-4 font-medium">SKU / Size</th>
                <th className="px-6 py-4 font-medium">Visible</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No products found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProducts?.map((product) => {
                  const isSelected = selectedIds.has(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${isSelected ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                    >
                      <td className="px-4 py-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(product.id)}
                          aria-label={`Select ${product.name}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted shrink-0 border border-border overflow-hidden">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-[10px] font-serif bg-secondary/5">
                                No img
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-foreground">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <div className="flex flex-wrap gap-1">
                          {product.collections.map((c) => (
                            <span
                              key={c.id}
                              className="inline-block text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 border border-border"
                            >
                              {c.name}
                            </span>
                          ))}
                          {product.collections.length === 0 && (
                            <span className="text-muted-foreground/50 text-xs italic">
                              No collection
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {product.sku && <div className="text-xs">SKU: {product.sku}</div>}
                        {product.size && <div className="text-xs">Size: {product.size}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <Switch
                          checked={product.available}
                          onCheckedChange={() =>
                            handleToggleAvailable(product.id, product.available)
                          }
                          disabled={updateProduct.isPending}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(`/admin/products/${product.id}/edit`)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id, product.name)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={deleteProduct.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
