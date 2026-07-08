import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useListProducts, useDeleteProduct, useUpdateProduct, getListProductsQueryKey } from '@workspace/api-client-react';
import { ProductCategory } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';

const categoryLabels: Record<string, string> = {
  tropicals: "Tropical Foliage",
  flowering: "Flowering Plants",
  planters: "Planters & Upgrades",
  easter: "Easter",
  mothers_day: "Mother's Day",
  cut_flowers: "Cut Flowers & Bouquets"
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: products, isLoading } = useListProducts({
    category: filterCategory !== 'all' ? filterCategory as ProductCategory : undefined
  });

  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      }
    }
  });

  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      }
    }
  });

  const handleToggleAvailable = (id: number, currentStatus: boolean) => {
    updateProduct.mutate({
      id,
      data: { available: !currentStatus }
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      deleteProduct.mutate({ id });
    }
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Products Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage catalog and weekly availability</p>
        </div>
        <Button onClick={() => setLocation('/admin/products/new')}>
          <Plus className="w-4 h-4 mr-2" /> New Product
        </Button>
      </div>

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
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent border-b border-input py-2 text-sm focus:outline-none cursor-pointer w-full md:w-48"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">SKU / Size</th>
                <th className="px-6 py-4 font-medium">In Stock</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading products...</td>
                </tr>
              ) : filteredProducts?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No products found matching your filters.</td>
                </tr>
              ) : (
                filteredProducts?.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted shrink-0 border border-border overflow-hidden">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-[10px] font-serif bg-secondary/5">No img</div>
                          )}
                        </div>
                        <span className="font-medium text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {categoryLabels[product.category]}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {product.sku && <div className="text-xs">SKU: {product.sku}</div>}
                      {product.size && <div className="text-xs">Size: {product.size}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Switch 
                        checked={product.available}
                        onCheckedChange={() => handleToggleAvailable(product.id, product.available)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
