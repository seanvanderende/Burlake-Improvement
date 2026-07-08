import React from 'react';
import { useLocation } from 'wouter';
import { useListProducts, useGetCategorySummary } from '@workspace/api-client-react';
import { ProductCategory } from '@workspace/api-client-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const categoryLabels: Record<string, string> = {
  tropicals: "Tropical Foliage",
  flowering: "Flowering Plants",
  planters: "Planters & Upgrades",
  easter: "Easter",
  mothers_day: "Mother's Day",
  cut_flowers: "Cut Flowers & Bouquets"
};

export default function Catalog() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get('category') || 'all';
  
  const [activeCategory, setActiveCategory] = React.useState<string>(initialCategory);
  const [inStockOnly, setInStockOnly] = React.useState(false);

  const { data: summary } = useGetCategorySummary();
  const { data: products, isLoading } = useListProducts({ 
    category: activeCategory !== 'all' ? activeCategory as ProductCategory : undefined,
    availableOnly: inStockOnly || undefined
  });

  const getCount = (cat: string) => {
    if (!summary) return 0;
    if (cat === 'all') {
      return summary.reduce((acc, curr) => acc + (inStockOnly ? curr.availableCount : curr.total), 0);
    }
    const catSummary = summary.find(s => s.category === cat);
    if (!catSummary) return 0;
    return inStockOnly ? catSummary.availableCount : catSummary.total;
  };

  return (
    <div className="bg-background pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-4 font-semibold">
            <div className="w-8 h-px bg-primary" />
            Wholesale Catalog
          </span>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h1 className="font-serif text-4xl md:text-5xl text-foreground leading-[1.1]">
              Available to the Trade
            </h1>
            
            <div className="flex items-center space-x-2 bg-muted/50 p-2 border border-border">
              <Switch 
                id="in-stock" 
                checked={inStockOnly} 
                onCheckedChange={setInStockOnly}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="in-stock" className="text-sm font-medium uppercase tracking-wider cursor-pointer">
                In Stock Only
              </Label>
            </div>
          </div>
        </div>

        <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <div className="overflow-x-auto pb-4 mb-8 scrollbar-hide border-b border-border">
            <TabsList className="h-auto p-0 bg-transparent flex justify-start min-w-max">
              <TabsTrigger value="all" className="pb-4">
                All Products <span className="ml-2 text-muted-foreground text-xs">({getCount('all')})</span>
              </TabsTrigger>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <TabsTrigger key={key} value={key} className="pb-4">
                  {label} <span className="ml-2 text-muted-foreground text-xs">({getCount(key)})</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/5] bg-muted w-full mb-4"></div>
                    <div className="h-4 bg-muted w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-border bg-muted/20">
                <p className="text-muted-foreground font-light text-lg">No products found for these filters.</p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => {
                    setActiveCategory('all');
                    setInStockOnly(false);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                {products?.map((product, index) => (
                  <Link key={product.id} href={`/product/${product.id}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-muted mb-4 border border-border transition-all duration-300 group-hover:border-primary/50">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-serif text-xl bg-secondary/5">
                          No Photo
                        </div>
                      )}
                      
                      {!product.available && (
                        <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-[0.65rem] font-bold uppercase tracking-widest px-2 py-1">
                          Out of Stock
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {categoryLabels[product.category]} {product.size ? `· ${product.size}` : ''}
                      </div>
                      <h3 className="font-serif text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.sku && (
                        <div className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
