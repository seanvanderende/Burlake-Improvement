import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpload } from '@workspace/object-storage-web';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const SEASONS = [
  "Valentine's Day",
  "Easter",
  "Mother's Day",
  "Spring",
  "Fall",
  "Christmas",
];

interface Brochure {
  id: number;
  title: string;
  season: string;
  objectPath: string;
  fileName: string;
  createdAt: string;
}

async function fetchBrochures(): Promise<Brochure[]> {
  const res = await fetch(`${BASE}/api/brochures`);
  if (!res.ok) throw new Error('Failed to fetch brochures');
  return res.json();
}

// ── Upload form ───────────────────────────────────────────────────────────────

function UploadForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [season, setSeason] = useState(SEASONS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [apiError, setApiError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading } = useUpload({
    basePath: `${BASE}/api/storage`,
  });

  const createBrochure = useMutation({
    mutationFn: async ({
      title,
      season,
      objectPath,
      fileName,
    }: {
      title: string;
      season: string;
      objectPath: string;
      fileName: string;
    }) => {
      const res = await fetch(`${BASE}/api/admin/brochures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, season, objectPath, fileName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create brochure');
      }
      return res.json();
    },
    onSuccess: () => {
      setTitle('');
      setSeason(SEASONS[0]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setApiError('');
      onDone();
    },
    onError: (err: Error) => setApiError(err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    if (!file) return;

    const result = await uploadFile(file);
    if (!result) return; // useUpload sets its own error state

    createBrochure.mutate({
      title: title.trim() || file.name.replace(/\.pdf$/i, ''),
      season,
      objectPath: result.objectPath,
      fileName: file.name,
    });
  };

  const busy = isUploading || createBrochure.isPending;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e4ddd4',
        borderRadius: '10px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Plus size={16} style={{ color: '#5a7c5e' }} />
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#2c2c2c' }}>
          Upload New Brochure
        </h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#555', marginBottom: '0.3rem' }}>
              Title
            </label>
            <Input
              type="text"
              placeholder="e.g. Easter 2026 Wholesale"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#555', marginBottom: '0.3rem' }}>
              Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                border: '1px solid #e4ddd4',
                borderRadius: '6px',
                padding: '0 0.5rem',
                fontSize: '0.9rem',
                color: '#2c2c2c',
                background: '#fff',
              }}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#555', marginBottom: '0.3rem' }}>
            PDF File
          </label>
          <div
            style={{
              border: '2px dashed #e4ddd4',
              borderRadius: '8px',
              padding: '1.25rem',
              textAlign: 'center',
              background: file ? '#f8fdf8' : '#faf8f4',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <FileText size={16} style={{ color: '#5a7c5e' }} />
                <span style={{ fontSize: '0.9rem', color: '#2c2c2c' }}>{file.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  ({(file.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ) : (
              <div style={{ color: '#888', fontSize: '0.9rem' }}>
                <Upload size={18} style={{ margin: '0 auto 0.4rem', display: 'block', color: '#bbb' }} />
                Click to select a PDF
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {apiError && (
          <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{apiError}</p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" disabled={busy || !file}>
            {isUploading ? 'Uploading…' : createBrochure.isPending ? 'Saving…' : 'Upload Brochure'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Brochure row ──────────────────────────────────────────────────────────────

function BrochureRow({ brochure, onDelete }: { brochure: Brochure; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/admin/brochures/${brochure.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => onDelete(),
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1rem',
        borderBottom: '1px solid #f0ebe3',
      }}
    >
      <FileText size={18} style={{ color: '#5a7c5e', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: '0.9rem', color: '#2c2c2c' }}>{brochure.title}</div>
        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.1rem' }}>
          {brochure.season} · {new Date(brochure.createdAt).toLocaleDateString('en-CA')}
        </div>
      </div>
      {confirming ? (
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <Button
            size="sm"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Confirm'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setConfirming(true)}
          style={{ color: '#c0392b', flexShrink: 0 }}
        >
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminBrochures() {
  const queryClient = useQueryClient();

  const { data: brochures, isLoading } = useQuery({
    queryKey: ['admin-brochures'],
    queryFn: fetchBrochures,
    retry: false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-brochures'] });

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: '#2c2c2c', margin: '0 0 0.35rem' }}>
          Brochures
        </h1>
        <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
          Upload seasonal PDF brochures for wholesale buyers.
        </p>
      </div>

      <UploadForm onDone={refresh} />

      <div
        style={{
          background: '#fff',
          border: '1px solid #e4ddd4',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '1rem 1rem 0', borderBottom: '1px solid #f0ebe3', marginBottom: 0 }}>
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#555' }}>
            All Brochures
          </h2>
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>Loading…</div>
        ) : !brochures || brochures.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa', fontSize: '0.9rem' }}>
            No brochures uploaded yet.
          </div>
        ) : (
          brochures.map((b) => (
            <BrochureRow key={b.id} brochure={b} onDelete={refresh} />
          ))
        )}
      </div>
    </div>
  );
}
