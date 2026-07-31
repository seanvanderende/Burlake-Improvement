import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useLocation } from 'wouter';
import { useUpload } from '@workspace/object-storage-web';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderForm {
  id: number;
  title: string;
  customerName: string;
  description: string | null;
  season: string | null;
  deadline: string | null;
  replyToEmail: string | null;
  status: 'draft' | 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface OrderFormItem {
  id: number;
  formId: number;
  name: string;
  itemNum: string | null;
  upc: string | null;
  pack: string | null;
  casePrice: string | null;
  category: string | null;
  photoUrl: string | null;
  sortOrder: number;
}

interface OrderFormWithItems extends OrderForm {
  items: OrderFormItem[];
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: '#f5a623',
  active: '#3a7d44',
  closed: '#888',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      background: STATUS_COLORS[status] + '22',
      color: STATUS_COLORS[status],
      border: `1px solid ${STATUS_COLORS[status]}44`,
    }}>
      {status}
    </span>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#555' }}>{label}</label>
      {children}
    </div>
  );
}

// ── Create form modal ─────────────────────────────────────────────────────────

function CreateFormModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('');
  const [deadline, setDeadline] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/admin/order-forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, customerName, description: description || undefined, season: season || undefined, deadline: deadline || undefined, replyToEmail: replyToEmail || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
      return res.json() as Promise<OrderForm>;
    },
    onSuccess: (form) => onCreated(form.id),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '480px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={18} /></button>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', marginBottom: '1.5rem', color: '#2c2c2c' }}>New Order Form</h2>
        <form onSubmit={(e) => { e.preventDefault(); setError(''); create.mutate(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Title *">
            <Input placeholder="e.g. 2026 Christmas Collection" value={title} onChange={e => setTitle(e.target.value)} required />
          </Field>
          <Field label="Customer Name *">
            <Input placeholder="e.g. Sobeys" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
          </Field>
          <Field label="Season / Collection">
            <Input placeholder="e.g. 2026 Christmas Collection" value={season} onChange={e => setSeason(e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Order Deadline">
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </Field>
          </div>
          <Field label="Reply-To Email">
            <Input type="email" placeholder="orders@burlake.com" value={replyToEmail} onChange={e => setReplyToEmail(e.target.value)} />
            <span style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.15rem' }}>Buyers' "Email Order" button will send to this address.</span>
          </Field>
          <Field label="Description (optional)">
            <textarea
              placeholder="Notes visible to the buyer at the top of the form…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0d9d0', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical', minHeight: '72px', fontFamily: 'inherit', color: '#2c2c2c' }}
            />
          </Field>
          {error && <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !title || !customerName}>
              {create.isPending ? 'Creating…' : 'Create & Edit Items'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Photo upload button ───────────────────────────────────────────────────────

function PhotoUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useUpload({
    basePath: `${BASE}/api/storage`,
    onSuccess: (resp) => {
      // Store as a full absolute URL so the mobile app can use it without needing to know the domain
      onUploaded(`${window.location.origin}${BASE}/api/storage${resp.objectPath}`);
    },
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so the same file can be re-selected
    await uploadFile(file);
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <button
        type="button"
        title={isUploading ? 'Uploading…' : 'Upload photo from computer'}
        disabled={isUploading}
        onClick={() => fileRef.current?.click()}
        style={{
          flexShrink: 0,
          height: 32,
          padding: '0 0.45rem',
          border: '1px solid #d4cdc4',
          borderRadius: 4,
          background: isUploading ? '#f5f2ee' : '#fff',
          cursor: isUploading ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          color: '#5a7c5e',
        }}
      >
        {isUploading
          ? <Loader2 size={14} className="animate-spin" />
          : <Upload size={14} />}
      </button>
    </>
  );
}

// ── Edit item modal ───────────────────────────────────────────────────────────

function EditItemModal({
  item,
  onClose,
  onSave,
}: {
  item: OrderFormItem;
  onClose: () => void;
  onSave: (id: number, patch: Partial<OrderFormItem>) => void;
}) {
  const [name, setName] = useState(item.name);
  const [itemNum, setItemNum] = useState(item.itemNum ?? '');
  const [upc, setUpc] = useState(item.upc ?? '');
  const [pack, setPack] = useState(item.pack ?? '');
  const [casePrice, setCasePrice] = useState(item.casePrice ?? '');
  const [category, setCategory] = useState(item.category ?? '');
  const [photoUrl, setPhotoUrl] = useState(item.photoUrl ?? '');

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(item.id, {
      name,
      itemNum: itemNum || null,
      upc: upc || null,
      pack: pack || null,
      casePrice: casePrice || null,
      category: category || null,
      photoUrl: photoUrl || null,
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '480px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}><X size={18} /></button>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', marginBottom: '1.5rem', color: '#2c2c2c' }}>Edit Item</h2>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Name *">
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Field label="Item #">
              <Input value={itemNum} onChange={e => setItemNum(e.target.value)} placeholder="CHR-001" />
            </Field>
            <Field label="UPC">
              <Input value={upc} onChange={e => setUpc(e.target.value)} placeholder="012345678901" />
            </Field>
            <Field label="Pack">
              <Input value={pack} onChange={e => setPack(e.target.value)} placeholder="6/tray" />
            </Field>
            <Field label="Case Price">
              <Input value={casePrice} onChange={e => setCasePrice(e.target.value)} type="number" step="0.01" min="0" placeholder="18.95" />
            </Field>
          </div>
          <Field label="Category">
            <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Poinsettias" />
          </Field>
          <Field label="Photo">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://…" style={{ flex: 1 }} />
              <PhotoUploadButton onUploaded={url => setPhotoUrl(url)} />
            </div>
            {photoUrl && (
              <img
                src={photoUrl}
                alt="preview"
                style={{ marginTop: '0.5rem', width: 64, height: 64, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0d9d0' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </Field>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name}>Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Item row (read-only, opens edit modal) ────────────────────────────────────

function ItemRow({
  item,
  onDelete,
  onSave,
}: {
  item: OrderFormItem;
  onDelete: (id: number) => void;
  onSave: (id: number, patch: Partial<OrderFormItem>) => void;
}) {
  const [editing, setEditing] = useState(false);

  const td: React.CSSProperties = { padding: '0.6rem 0.5rem', borderBottom: '1px solid #f0ebe3', fontSize: '0.85rem', color: '#333', verticalAlign: 'middle' };

  return (
    <>
      {editing && (
        <EditItemModal
          item={item}
          onClose={() => setEditing(false)}
          onSave={onSave}
        />
      )}
      <tr style={{ transition: 'background 0.1s' }} onMouseEnter={e => (e.currentTarget.style.background = '#faf8f4')} onMouseLeave={e => (e.currentTarget.style.background = '')}>
        <td style={td}>{item.name}</td>
        <td style={{ ...td, color: '#888' }}>{item.itemNum || '—'}</td>
        <td style={{ ...td, color: '#888', fontFamily: 'monospace', fontSize: '0.8rem' }}>{item.upc || '—'}</td>
        <td style={{ ...td, color: '#888' }}>{item.pack || '—'}</td>
        <td style={td}>{item.casePrice ? `$${parseFloat(item.casePrice).toFixed(2)}` : '—'}</td>
        <td style={td}>
          {item.category ? (
            <span style={{ background: '#eef6ef', color: '#3a7d44', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{item.category}</span>
          ) : '—'}
        </td>
        <td style={td}>
          {item.photoUrl ? (
            <img src={item.photoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #e0d9d0', display: 'block' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          ) : <span style={{ color: '#ccc', fontSize: '0.75rem' }}>—</span>}
        </td>
        <td style={{ ...td, whiteSpace: 'nowrap' }}>
          <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', marginRight: '0.5rem' }}><Edit2 size={14} /></button>
          <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b' }}><Trash2 size={14} /></button>
        </td>
      </tr>
    </>
  );
}

// ── Add item form ─────────────────────────────────────────────────────────────

function AddItemForm({ formId, onAdded }: { formId: number; onAdded: () => void }) {
  const [name, setName] = useState('');
  const [itemNum, setItemNum] = useState('');
  const [upc, setUpc] = useState('');
  const [pack, setPack] = useState('');
  const [casePrice, setCasePrice] = useState('');
  const [category, setCategory] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');

  const addItem = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/admin/order-forms/${formId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, itemNum: itemNum || undefined, upc: upc || undefined, pack: pack || undefined, casePrice: casePrice ? parseFloat(casePrice) : undefined, category: category || undefined, photoUrl: photoUrl || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
      return res.json();
    },
    onSuccess: () => {
      setName(''); setItemNum(''); setUpc(''); setPack(''); setCasePrice(''); setCategory(''); setPhotoUrl('');
      setError('');
      onAdded();
    },
    onError: (e: Error) => setError(e.message),
  });

  const bulkImport = useMutation({
    mutationFn: async () => {
      // Parse CSV: Name, Item#, UPC, Pack, CasePrice, Category
      const lines = bulkText.trim().split('\n').filter(l => l.trim());
      const items = lines.map((line, i) => {
        const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
        const clean = (s?: string) => s?.trim().replace(/^["']|["']$/g, '') ?? '';
        return {
          name: clean(parts[0]),
          itemNum: clean(parts[1]),
          upc: clean(parts[2]),
          pack: clean(parts[3]),
          casePrice: parseFloat(clean(parts[4])) || undefined,
          category: clean(parts[5]),
          sortOrder: i,
        };
      }).filter(it => it.name);
      if (!items.length) throw new Error('No valid rows found');
      const res = await fetch(`${BASE}/api/admin/order-forms/${formId}/items/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
      return res.json();
    },
    onSuccess: () => { setBulkText(''); setBulkError(''); setBulkMode(false); onAdded(); },
    onError: (e: Error) => setBulkError(e.message),
  });

  const inputStyle: React.CSSProperties = { fontSize: '0.85rem' };

  return (
    <div style={{ background: '#faf8f4', borderTop: '1px solid #e4ddd4', padding: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#555' }}>Add items</span>
        <button
          onClick={() => setBulkMode(!bulkMode)}
          style={{ fontSize: '0.8rem', color: '#5a7c5e', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          <Upload size={13} /> {bulkMode ? 'Single item' : 'Bulk paste (CSV / TSV)'}
        </button>
      </div>

      {bulkMode ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>
            Paste rows as: <strong>Name, Item#, UPC, Pack, Case Price, Category</strong> (tab or comma-separated, one per line)
          </p>
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={'Poinsettia 6" Red\tCHR-001\t012345678901\t6/pack\t18.95\tPoinsettias\nPoinsettia 4" White\tCHR-002\t012345678902\t10/pack\t11.50\tPoinsettias'}
            style={{ fontFamily: 'monospace', fontSize: '0.8rem', padding: '0.5rem', border: '1px solid #e0d9d0', borderRadius: '6px', resize: 'vertical', minHeight: '100px', width: '100%' }}
          />
          {bulkError && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: 0 }}>{bulkError}</p>}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button size="sm" onClick={() => { setBulkError(''); bulkImport.mutate(); }} disabled={bulkImport.isPending || !bulkText.trim()}>
              {bulkImport.isPending ? 'Importing…' : `Import rows`}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkMode(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setError(''); addItem.mutate(); }} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 160px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#888', marginBottom: '0.2rem' }}>Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product name" style={inputStyle} required />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#888', marginBottom: '0.2rem' }}>Item #</label>
            <Input value={itemNum} onChange={e => setItemNum(e.target.value)} placeholder="CHR-001" style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 110px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#888', marginBottom: '0.2rem' }}>UPC</label>
            <Input value={upc} onChange={e => setUpc(e.target.value)} placeholder="012345678901" style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#888', marginBottom: '0.2rem' }}>Pack</label>
            <Input value={pack} onChange={e => setPack(e.target.value)} placeholder="6/tray" style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 80px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#888', marginBottom: '0.2rem' }}>Case Price</label>
            <Input value={casePrice} onChange={e => setCasePrice(e.target.value)} placeholder="18.95" type="number" step="0.01" min="0" style={inputStyle} />
          </div>
          <div style={{ flex: '1 1 100px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#888', marginBottom: '0.2rem' }}>Category</label>
            <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Poinsettias" style={inputStyle} />
          </div>
          <div style={{ flex: '2 1 180px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#888', marginBottom: '0.2rem' }}>Photo</label>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://… or upload →" style={inputStyle} />
              <PhotoUploadButton onUploaded={url => setPhotoUrl(url)} />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={addItem.isPending || !name} style={{ flexShrink: 0 }}>
            <Plus size={14} style={{ marginRight: '0.25rem' }} />{addItem.isPending ? 'Adding…' : 'Add'}
          </Button>
          {error && <p style={{ color: '#c0392b', fontSize: '0.8rem', margin: 0, width: '100%' }}>{error}</p>}
        </form>
      )}
    </div>
  );
}

// ── Form editor (expanded panel) ──────────────────────────────────────────────

function FormEditor({ formId, onClose }: { formId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const qk = ['admin-order-form', formId];

  const { data: form, isLoading } = useQuery<OrderFormWithItems>({
    queryKey: qk,
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/order-forms/${formId}`);
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    },
  });

  const [editingMeta, setEditingMeta] = useState(false);
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [season, setSeason] = useState('');
  const [deadline, setDeadline] = useState('');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [status, setStatus] = useState('draft');

  React.useEffect(() => {
    if (form && !editingMeta) {
      setTitle(form.title);
      setCustomerName(form.customerName);
      setDescription(form.description ?? '');
      setSeason(form.season ?? '');
      setDeadline(form.deadline ?? '');
      setReplyToEmail(form.replyToEmail ?? '');
      setStatus(form.status);
    }
  }, [form, editingMeta]);

  const saveMeta = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/admin/order-forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, customerName, description: description || null, season: season || null, deadline: deadline || null, replyToEmail: replyToEmail || null, status }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: qk }); queryClient.invalidateQueries({ queryKey: ['admin-order-forms'] }); setEditingMeta(false); },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetch(`${BASE}/api/admin/order-forms/${formId}/items/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const saveItem = useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<OrderFormItem> }) => {
      const res = await fetch(`${BASE}/api/admin/order-forms/${formId}/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: qk });

  const containerStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #c8deca',
    borderRadius: '10px',
    marginBottom: '1rem',
    overflow: 'hidden',
  };

  if (isLoading || !form) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>Loading…</div>;
  }

  return (
    <div style={containerStyle}>
      {/* Meta section */}
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e4ddd4', background: '#f9fdf9' }}>
        {editingMeta ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <Field label="Title *"><Input value={title} onChange={e => setTitle(e.target.value)} /></Field>
              <Field label="Customer Name *"><Input value={customerName} onChange={e => setCustomerName(e.target.value)} /></Field>
              <Field label="Season / Collection"><Input value={season} onChange={e => setSeason(e.target.value)} /></Field>
              <Field label="Order Deadline"><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} /></Field>
            </div>
            <Field label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e0d9d0', borderRadius: '6px', fontSize: '0.9rem', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }} />
            </Field>
            <Field label="Reply-To Email">
              <Input type="email" placeholder="orders@burlake.com" value={replyToEmail} onChange={e => setReplyToEmail(e.target.value)} />
            </Field>
            <Field label="Status">
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e0d9d0', borderRadius: '6px', fontSize: '0.9rem' }}>
                <option value="draft">Draft (hidden from portal)</option>
                <option value="active">Active (visible to buyers)</option>
                <option value="closed">Closed (no longer accepting orders)</option>
              </select>
            </Field>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button size="sm" onClick={() => saveMeta.mutate()} disabled={saveMeta.isPending}>{saveMeta.isPending ? 'Saving…' : 'Save changes'}</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingMeta(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#2c2c2c' }}>{form.title}</h3>
                <StatusBadge status={form.status} />
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                {form.customerName}{form.season ? ` · ${form.season}` : ''}{form.deadline ? ` · Due ${form.deadline}` : ''}
              </p>
              {form.description && <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#888' }}>{form.description}</p>}
              {form.replyToEmail && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#5a7c5e' }}>Reply-to: {form.replyToEmail}</p>}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <Button size="sm" variant="outline" onClick={() => setEditingMeta(true)}><Edit2 size={13} style={{ marginRight: '0.25rem' }} />Edit</Button>
              <Button size="sm" variant="outline" onClick={onClose}><ChevronUp size={13} /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Items table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#faf8f4' }}>
              {['Name', 'Item #', 'UPC', 'Pack', 'Case Price', 'Category', 'Photo', ''].map(h => (
                <th key={h} style={{ padding: '0.6rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', textAlign: 'left', borderBottom: '1px solid #e4ddd4' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {form.items.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#aaa', fontSize: '0.9rem' }}>No items yet — add some below.</td></tr>
            ) : (
              form.items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onDelete={(id) => { if (confirm('Delete this item?')) deleteItem.mutate(id); }}
                  onSave={(id, patch) => saveItem.mutate({ id, patch })}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      <AddItemForm formId={formId} onAdded={refresh} />
    </div>
  );
}

// ── Form list row ─────────────────────────────────────────────────────────────

function FormRow({ form, onDelete }: { form: OrderForm; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const deleteForm = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/admin/order-forms/${form.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-order-forms'] }); onDelete(); },
  });

  return (
    <>
      <tr
        style={{ cursor: 'pointer', transition: 'background 0.1s', background: expanded ? '#f9fdf9' : '' }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#faf8f4'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = ''; }}
        onClick={() => setExpanded(!expanded)}
      >
        <td style={{ padding: '0.9rem 1rem', borderBottom: expanded ? 'none' : '1px solid #f0ebe3' }}>
          <div style={{ fontWeight: 600, color: '#2c2c2c', fontSize: '0.9rem' }}>{form.title}</div>
          {form.season && <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.15rem' }}>{form.season}</div>}
        </td>
        <td style={{ padding: '0.9rem 0.75rem', borderBottom: expanded ? 'none' : '1px solid #f0ebe3', fontSize: '0.88rem', color: '#555' }}>{form.customerName}</td>
        <td style={{ padding: '0.9rem 0.75rem', borderBottom: expanded ? 'none' : '1px solid #f0ebe3' }}>
          <StatusBadge status={form.status} />
        </td>
        <td style={{ padding: '0.9rem 0.75rem', borderBottom: expanded ? 'none' : '1px solid #f0ebe3', fontSize: '0.82rem', color: '#888' }}>
          {form.deadline ? new Date(form.deadline).toLocaleDateString('en-CA') : '—'}
        </td>
        <td style={{ padding: '0.9rem 0.75rem', borderBottom: expanded ? 'none' : '1px solid #f0ebe3', textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ color: '#888' }}>{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${form.title}"? This cannot be undone.`)) deleteForm.mutate(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', padding: '0.2rem' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} style={{ padding: '0 1rem 1rem', borderBottom: '1px solid #f0ebe3' }}>
            <FormEditor formId={form.id} onClose={() => setExpanded(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminOrderForms() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [, setLocation] = useLocation();

  const { data: forms, isLoading } = useQuery<OrderForm[]>({
    queryKey: ['admin-order-forms'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/admin/order-forms`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-order-forms'] });

  return (
    <div>
      {showCreate && (
        <CreateFormModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            refresh();
            // Scroll to top; the new form will appear at top of list
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: '#2c2c2c', margin: '0 0 0.35rem' }}>Order Forms</h1>
          <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
            Create tailored order forms for your wholesale buyers. Set status to <strong>Active</strong> to make them visible in the Customer Portal.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} style={{ flexShrink: 0 }}>
          <Plus size={15} style={{ marginRight: '0.4rem' }} /> New Form
        </Button>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e4ddd4', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f0ebe3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#555' }}>All Order Forms</h2>
          <span style={{ fontSize: '0.82rem', color: '#aaa' }}>{forms?.length ?? 0} form{forms?.length !== 1 ? 's' : ''}</span>
        </div>

        {isLoading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa' }}>Loading…</div>
        ) : !forms || forms.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa', fontSize: '0.9rem' }}>
            No order forms yet. Click <strong>New Form</strong> to create your first one.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#faf8f4' }}>
                {['Form Title', 'Customer', 'Status', 'Deadline', ''].map(h => (
                  <th key={h} style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', textAlign: 'left', borderBottom: '1px solid #e4ddd4' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forms.map(form => (
                <FormRow key={form.id} form={form} onDelete={refresh} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
