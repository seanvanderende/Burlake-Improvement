import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Lock, Download, ChevronRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const SEASON_ORDER = [
  "Valentine's Day",
  "Easter",
  "Mother's Day",
  "Spring",
  "Fall",
  "Christmas",
];

const SEASON_COLORS: Record<string, string> = {
  "Valentine's Day": "#b5103c",
  "Easter": "#8b5ea8",
  "Mother's Day": "#c0446b",
  "Spring": "#4a7c4e",
  "Fall": "#c26a1e",
  "Christmas": "#2e6b3e",
};

interface Brochure {
  id: number;
  title: string;
  season: string;
  objectPath: string;
  fileName: string;
  createdAt: string;
}

interface AuthStatus {
  authenticated: boolean;
}

async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch(`${BASE}/api/brochures/auth`);
  if (!res.ok) throw new Error('Failed to check auth');
  return res.json();
}

async function fetchBrochures(): Promise<Brochure[]> {
  const res = await fetch(`${BASE}/api/brochures`);
  if (!res.ok) throw new Error('Failed to fetch brochures');
  return res.json();
}

function groupBySeasonOrdered(brochures: Brochure[]): [string, Brochure[]][] {
  const map = new Map<string, Brochure[]>();
  for (const b of brochures) {
    if (!map.has(b.season)) map.set(b.season, []);
    map.get(b.season)!.push(b);
  }
  // Sort by SEASON_ORDER, then any extras alphabetically
  const known = SEASON_ORDER.filter((s) => map.has(s));
  const extra = [...map.keys()].filter((s) => !SEASON_ORDER.includes(s)).sort();
  return [...known, ...extra].map((s) => [s, map.get(s)!]);
}

// ── Password gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const unlock = useMutation({
    mutationFn: async (pw: string) => {
      const res = await fetch(`${BASE}/api/brochures/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Incorrect password');
      }
      return res.json();
    },
    onSuccess: () => onSuccess(),
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    unlock.mutate(password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#faf8f4',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: '1px solid #e4ddd4',
          borderRadius: '12px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '380px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#f0ebe3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}
        >
          <Lock size={24} style={{ color: '#5a7c5e' }} />
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', marginBottom: '0.5rem', color: '#2c2c2c' }}>
          Wholesale Brochures
        </h1>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Enter the buyer access code to view and download our seasonal brochures.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Input
            type="password"
            placeholder="Access code"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            style={{ textAlign: 'center', letterSpacing: '0.1em' }}
          />
          {error && (
            <p style={{ color: '#c0392b', fontSize: '0.85rem', margin: 0 }}>{error}</p>
          )}
          <Button type="submit" disabled={unlock.isPending || !password} className="w-full">
            {unlock.isPending ? 'Checking…' : 'View Brochures'}
          </Button>
        </form>
        <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#999' }}>
          Contact your sales rep if you need the access code.
        </p>
      </div>
    </div>
  );
}

// ── Brochure card ─────────────────────────────────────────────────────────────

function BrochureCard({ brochure }: { brochure: Brochure }) {
  const color = SEASON_COLORS[brochure.season] ?? '#5a7c5e';
  const downloadUrl = `${BASE}/api/storage${brochure.objectPath}`;

  return (
    <a
      href={downloadUrl}
      download={brochure.fileName}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: '#fff',
        border: '1px solid #e4ddd4',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e4ddd4';
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FileText size={20} style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#2c2c2c', marginBottom: '0.15rem' }}>
          {brochure.title}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#888' }}>
          {new Date(brochure.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}PDF
        </div>
      </div>
      <Download size={16} style={{ color: '#aaa', flexShrink: 0 }} />
    </a>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Brochures() {
  const queryClient = useQueryClient();

  const { data: auth, isLoading: authLoading } = useQuery({
    queryKey: ['brochures-auth'],
    queryFn: fetchAuthStatus,
    retry: false,
  });

  const { data: brochures, isLoading: brochuresLoading } = useQuery({
    queryKey: ['brochures'],
    queryFn: fetchBrochures,
    enabled: !!auth?.authenticated,
    retry: false,
  });

  const handleUnlocked = () => {
    queryClient.invalidateQueries({ queryKey: ['brochures-auth'] });
    queryClient.invalidateQueries({ queryKey: ['brochures'] });
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f4' }}>
        <p style={{ color: '#888' }}>Loading…</p>
      </div>
    );
  }

  if (!auth?.authenticated) {
    return <PasswordGate onSuccess={handleUnlocked} />;
  }

  const grouped = brochures ? groupBySeasonOrdered(brochures) : [];

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #e4ddd4', background: '#fff', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Leaf size={20} style={{ color: '#5a7c5e' }} />
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.1rem', color: '#2c2c2c' }}>
            Burnaby Lake Greenhouses
          </span>
          <ChevronRight size={14} style={{ color: '#bbb' }} />
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Wholesale Brochures</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: '#2c2c2c', margin: '0 0 0.5rem' }}>
            Seasonal Brochures
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Download our latest wholesale brochures for each season.
          </p>
        </div>

        {brochuresLoading ? (
          <p style={{ color: '#aaa' }}>Loading brochures…</p>
        ) : grouped.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid #e4ddd4',
              borderRadius: '10px',
              padding: '3rem',
              textAlign: 'center',
              color: '#888',
            }}
          >
            No brochures available yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {grouped.map(([season, items]) => (
              <div key={season}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: SEASON_COLORS[season] ?? '#5a7c5e',
                      flexShrink: 0,
                    }}
                  />
                  <h2
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: '#2c2c2c',
                      margin: 0,
                    }}
                  >
                    {season}
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {items.map((b) => (
                    <BrochureCard key={b.id} brochure={b} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
