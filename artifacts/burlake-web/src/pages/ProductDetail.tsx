import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'wouter';
import { useGetProduct } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, XCircle } from 'lucide-react';
import { Seo, JsonLd } from '@/components/Seo';
import { absoluteUrl } from '@/lib/seo';

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
        <Seo
          title="Loading Variety…"
          description="Browse Burnaby Lake Greenhouses' wholesale plant catalog."
          path={`/product/${id}`}
          noindex
        />
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
        <Seo
          title="Variety Not Available"
          description="This variety may be seasonal or no longer in our current range. Browse our full wholesale catalog."
          path={`/product/${id}`}
          noindex
        />
        <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-6 font-semibold">
          <div className="w-8 h-px bg-primary" />
          Wholesale Catalog
          <div className="w-8 h-px bg-primary" />
        </span>
        <h1 className="font-serif text-3xl mb-4">Variety Not Available</h1>
        <p className="text-muted-foreground font-light mb-8 max-w-sm leading-relaxed">
          This variety may be seasonal or no longer in our current range. Browse our full
          selection to find what you need.
        </p>
        <Link href="/catalog">
          <Button variant="outline">Browse Full Range</Button>
        </Link>
      </div>
    );
  }

  const productDescription =
    product.description ||
    `${product.name}${product.size ? ` — ${product.size}` : ''}. Wholesale pricing available exclusively to Burnaby Lake Greenhouses' retail trade partners.`;

  return (
    <div className="bg-background pt-24 pb-24 min-h-screen">
      <Seo
        title={product.name}
        description={productDescription.slice(0, 300)}
        path={`/product/${product.id}`}
        image={product.imageUrl ?? undefined}
        type="article"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: productDescription,
          sku: product.sku ?? undefined,
          image: gallery.length > 0 ? gallery.map((u) => absoluteUrl(u)) : undefined,
          category: product.collections.length > 0 ? product.collections.map((c) => c.name).join(', ') : undefined,
          brand: { '@type': 'Brand', name: 'Burnaby Lake Greenhouses' },
          offers: {
            '@type': 'Offer',
            availability: product.available
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: absoluteUrl(`/product/${product.id}`),
            priceCurrency: 'CAD',
            businessFunction: 'https://schema.org/Sell',
            eligibleCustomerType: 'https://schema.org/Reseller',
          },
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Catalog', item: absoluteUrl('/catalog') },
            { '@type': 'ListItem', position: 3, name: product.name, item: absoluteUrl(`/product/${product.id}`) },
          ],
        }}
      />
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
                  Photo Coming Soon
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
                    <img src={url} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-6 lg:col-span-5 flex flex-col pt-4 md:pt-12">
            {/* Eyebrow — collection label or default brand label */}
            <span className="inline-flex items-center gap-3 text-primary tracking-[0.2em] text-sm uppercase mb-4 font-semibold">
              <div className="w-8 h-px bg-primary" />
              {product.collections.length > 0
                ? product.collections.map((c) => c.name).join(' · ')
                : 'Wholesale Catalog'}
            </span>

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

            {product.description ? (
              <div className="mt-8">
                <h3 className="font-serif text-xl mb-3">About This Variety</h3>
                <p className="text-muted-foreground font-light leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            ) : (
              <div className="mt-8">
                <p className="text-muted-foreground font-light leading-relaxed italic">
                  Grown to the Western Canada quality standard — over 65 years of expertise
                  behind every plant we bring to market.
                </p>
              </div>
            )}

            <div className="mt-auto pt-12">
              <div className="bg-secondary/5 p-6 border border-border">
                <h4 className="font-serif text-lg mb-2">Trade Pricing</h4>
                <p className="text-sm text-muted-foreground font-light mb-4">
                  Pricing is available exclusively to our retail trade partners. Speak
                  with your representative to confirm availability and add this variety
                  to your next order.
                </p>
                <Link href="/contact" className="w-full">
                  <Button variant="outline" className="w-full uppercase tracking-wider">
                    Request a Quote
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
