import React, { useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import { useCreateProduct, useUpdateProduct, useGetProduct, getListProductsQueryKey } from '@workspace/api-client-react';
import { ProductCategory } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Link } from 'wouter';
import { ObjectUploader } from '@workspace/object-storage-web';

const categoryLabels: Record<string, string> = {
  tropicals: "Tropical Foliage",
  flowering: "Flowering Plants",
  planters: "Planters & Upgrades",
  easter: "Easter",
  mothers_day: "Mother's Day",
  cut_flowers: "Cut Flowers & Bouquets"
};

export default function ProductForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  // Presigned PUT uploads return no response body, so we can't read the
  // objectPath back from result.successful[0].response. Stash it here,
  // keyed by Uppy's stable file.id, when we request the upload URL.
  const uploadObjectPaths = useRef<Record<string, string>>({});
  
  const isEdit = !!params.id && params.id !== 'new';
  const id = parseInt(params.id || '0', 10);

  const { data: product, isLoading: isFetching } = useGetProduct(id, {
    query: { enabled: isEdit, queryKey: ['product', id] }
  });

  const [formData, setFormData] = React.useState({
    name: '',
    category: 'tropicals' as ProductCategory,
    sku: '',
    size: '',
    description: '',
    available: true,
    imageUrl: '',
    sortOrder: 0
  });

  const initializedForId = useRef<number | null>(null);

  useEffect(() => {
    if (isEdit && product && initializedForId.current !== id) {
      initializedForId.current = id;
      setFormData({
        name: product.name,
        category: product.category,
        sku: product.sku || '',
        size: product.size || '',
        description: product.description || '',
        available: product.available,
        imageUrl: product.imageUrl || '',
        sortOrder: product.sortOrder || 0
      });
    }
  }, [product, id, isEdit]);

  const createMutation = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        setLocation('/admin');
      }
    }
  });

  const updateMutation = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['product', id] });
        setLocation('/admin');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      sku: formData.sku || null,
      size: formData.size || null,
      description: formData.description || null,
      imageUrl: formData.imageUrl || null
    };

    if (isEdit) {
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isFetching) {
    return <div className="p-12 text-center text-muted-foreground">Loading product data...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>
      </div>

      <h1 className="font-serif text-3xl text-foreground mb-8">
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card border border-border p-6 md:p-8 space-y-6">
          <h2 className="font-serif text-xl border-b border-border pb-2">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select 
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ProductCategory }))}
                className="flex h-12 w-full border-b border-input bg-transparent px-0 py-2 text-base focus-visible:outline-none focus-visible:border-primary transition-colors"
                required
              >
                {Object.entries(categoryLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input 
                id="sku" 
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size / Specs (Optional)</Label>
              <Input 
                id="size" 
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                placeholder="e.g. 6 inch pot"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea 
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="flex w-full border-b border-input bg-transparent px-0 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary transition-colors resize-none"
            ></textarea>
          </div>
        </div>

        <div className="bg-card border border-border p-6 md:p-8 space-y-6">
          <h2 className="font-serif text-xl border-b border-border pb-2">Status & Imagery</h2>

          <div className="flex items-center space-x-4 p-4 border border-border bg-muted/20">
            <Switch 
              id="available" 
              checked={formData.available}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
            />
            <div>
              <Label htmlFor="available" className="text-base font-medium block">In Stock (Available)</Label>
              <span className="text-sm text-muted-foreground">Show this product as available in the catalog</span>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Product Photo</Label>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-48 h-60 border border-border bg-muted shrink-0 flex items-center justify-center overflow-hidden relative group">
                {formData.imageUrl ? (
                  <>
                    <img src={formData.imageUrl} alt="Product preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="button" variant="destructive" size="sm" onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}>
                        Remove
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">No Image</p>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <ObjectUploader
                  onGetUploadParameters={async (file: any) => {
                    const res = await fetch("/api/storage/uploads/request-url", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: file.name,
                        size: file.size,
                        contentType: file.type,
                      }),
                    });
                    if (res.status === 401) {
                      setLocation('/admin/login');
                      throw new Error("Unauthorized");
                    }
                    const { uploadURL, objectPath } = await res.json();
                    uploadObjectPaths.current[file.id] = objectPath;
                    return {
                      method: "PUT",
                      url: uploadURL,
                      headers: { "Content-Type": file.type },
                    };
                  }}
                  onComplete={(result: any) => {
                    if (result && result.successful && result.successful.length > 0) {
                      const fileId = result.successful[0].id;
                      const objectPath = uploadObjectPaths.current[fileId];
                      if (objectPath) {
                        setFormData(prev => ({ ...prev, imageUrl: `/api/storage${objectPath}` }));
                        delete uploadObjectPaths.current[fileId];
                      }
                    }
                  }}
                >
                  <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 uppercase tracking-wider cursor-pointer">
                    <Upload className="w-4 h-4" /> Upload New Photo
                  </div>
                </ObjectUploader>
                <p className="text-sm text-muted-foreground font-light">
                  Upload a high-quality product photo. JPG or PNG format.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Link href="/admin">
            <Button type="button" variant="outline" disabled={isPending}>Cancel</Button>
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : (isEdit ? 'Save Changes' : 'Create Product')}
          </Button>
        </div>
      </form>
    </div>
  );
}
