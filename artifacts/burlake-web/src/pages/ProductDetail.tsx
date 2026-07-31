import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useGetProduct } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, XCircle } from 'lucide-react';

export default function ProductDetail() {
  const params = useParams();
  const id = parseInt(params.id || '0', 10);

  const { data: product, isLoading, error } = useGetProduct(id, {
    query: { enabled: !!id, queryKey: ['product', id] },
  });

  const gallery = React.useMemo(
    () => [product?.imageUrl, ...(product?.photos ?? [])].filter((u): u is string => !!u),
    [product],
  );
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  useEffect(() => {
    setActivePhoto(gallery[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="bg-background pt-32 pb-24 min-h-[70vh] flex justify-center">
        <div className="animate-pulse w-full max-w-7xl px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-muted"></div>
          <div className="space-y-6 pt-8">
            <div className="h-4 bg-muted w-1/4"></div>
            <div className="h-10 bg-muted w-3/4"></div>
            <div className="h-24 bg-muted w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-background pt-32 pb-24 min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-serif text-3xl mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/catalog">
          <Button variant="outline">Return to Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background pt-24 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <Link
          href="/catalog"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8 uppercase tracking-wider"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> Back to Catalog
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
          <div className="md:col-span-6 lg:col-span-7">
            <div className="aspect-[4/5] bg-muted border border-border overflow-hidden relative">
              {activePhoto ? (
                <img
                  src={activePhoto}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 font-serif text-2xl bg-secondary/5">
                  No Photo Available
                </div>
              )}
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-3 mt-4 flex-wrap">
                {gallery.map((url, index) => (
                  <button
                    key={url + index}
                    type="button"
                    onClick={() => setActivePhoto(url)}
                    className={`w-16 h-16 md:w-20 md:h-20 border overflow-hidden shrink-0 transition-colors ${
                      activePhoto === url ? 'border-primary' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <img src={url} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-6 lg:col-span-5 flex flex-col pt-4 md:pt-12">
            {product.collections.length > 0 && (
              <div className="text-sm text-primary uppercase tracking-[0.2em] font-semibold mb-4">
                {product.collections.map((c) => c.name).join(' · ')}
              </div>
            )}

            <h1 className="font-serif text-4xl lg:text-5xl text-foreground leading-[1.1] mb-6">
              {product.name}
            </h1>

            {!product.available && (
              <div className="flex items-center gap-2 mb-8">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive-foreground bg-destructive px-3 py-1 uppercase tracking-wider">
                  <XCircle className="w-4 h-4" /> Out of Stock
                </span>
              </div>
            )}

            <div className="border-t border-b border-border py-6 my-2 grid grid-cols-2 gap-4">
              {product.sku && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">SKU</div>
                  <div className="font-medium text-foreground">{product.sku}</div>
                </div>
              )}
              {product.size && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Size Spec</div>
                  <div className="font-medium text-foreground">{product.size}</div>
                </div>
              )}
            </div>

            {product.description && (
              <div className="mt-8">
                <h3 className="font-serif text-xl mb-3">Product Details</h3>
                <p className="text-muted-foreground font-light leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-auto pt-12">
              <div className="bg-secondary/5 p-6 border border-border">
                <h4 className="font-serif text-lg mb-2">Wholesale Pricing</h4>
                <p className="text-sm text-muted-foreground font-light mb-4">
                  Pricing is available exclusively to approved retail partners. Contact your sales
                  representative to place an order.
                </p>
                <Link href="/contact" className="w-full">
                  <Button variant="outline" className="w-full">
                    Partner With Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
