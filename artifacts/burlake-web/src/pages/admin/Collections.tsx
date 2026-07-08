import React, { useState } from 'react';
import {
  useListCollections,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  getListCollectionsQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react';

export default function AdminCollections() {
  const queryClient = useQueryClient();
  const { data: collections, isLoading } = useListCollections();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });

  const createMutation = useCreateCollection({
    mutation: { onSuccess: () => { setNewName(''); invalidate(); } },
  });

  const updateMutation = useUpdateCollection({
    mutation: {
      onSuccess: () => {
        setEditingId(null);
        setEditingName('');
        invalidate();
      },
    },
  });

  const deleteMutation = useDeleteCollection({
    mutation: { onSuccess: invalidate },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate({ data: { name: newName.trim() } });
  };

  const startEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleUpdate = (id: number) => {
    if (!editingName.trim()) return;
    updateMutation.mutate({ id, data: { name: editingName.trim() } });
  };

  const handleDelete = (id: number, name: string, count: number) => {
    const msg =
      count > 0
        ? `Delete "${name}"? It is currently assigned to ${count} product${count !== 1 ? 's' : ''}. Products will not be deleted, but this collection tag will be removed from them.`
        : `Delete "${name}"? This cannot be undone.`;
    if (window.confirm(msg)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Collections</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the collection tags used to organise your catalog.
        </p>
      </div>

      {/* Add new collection */}
      <form onSubmit={handleCreate} className="bg-card border border-border p-4">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">
          Add New Collection
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Collection name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1"
            disabled={createMutation.isPending}
          />
          <Button type="submit" disabled={!newName.trim() || createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Plus className="w-4 h-4 mr-1" /> Add</>
            )}
          </Button>
        </div>
      </form>

      {/* Collection list */}
      <div className="bg-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 text-left font-medium">Collection</th>
              <th className="px-6 py-4 text-left font-medium">Slug</th>
              <th className="px-6 py-4 text-left font-medium">Products</th>
              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : collections?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                  No collections yet. Add one above.
                </td>
              </tr>
            ) : (
              collections?.map((col) => (
                <tr key={col.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === col.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(col.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        className="h-8 py-1"
                      />
                    ) : (
                      <span className="font-medium text-foreground">{col.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                    {col.slug}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {col.productCount}
                    {col.availableCount < col.productCount && (
                      <span className="text-xs ml-1">
                        ({col.availableCount} in stock)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingId === col.id ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700"
                          onClick={() => handleUpdate(col.id)}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={cancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => startEdit(col.id, col.name)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(col.id, col.name, col.productCount)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {collections && collections.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {collections.length} collection{collections.length !== 1 ? 's' : ''} total
        </p>
      )}
    </div>
  );
}
