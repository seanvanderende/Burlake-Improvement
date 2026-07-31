import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, FileText, List, ChevronRight, Leaf, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface AuthStatus {
  authenticated: boolean;
}

async function fetchAuthStatus(): Promise<AuthStatus> {
  const res = await fetch(`${BASE}/api/brochures/auth`);
  if (!res.ok) throw new Error('Failed to check auth');
  return res.json();
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
          Customer Portal
        </h1>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Enter your buyer access code to continue.
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
            {unlock.isPending ? 'Checking…' : 'Enter Portal'}
          </Button>
        </form>
        <p style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: '#999' }}>
          Contact your sales rep if you need the access code.
        </p>
      </div>
    </div>
  );
}

// ── Portal card ───────────────────────────────────────────────────────────────

function PortalCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #e4ddd4',
          borderRadius: '12px',
          padding: '1.75rem',
          cursor: 'pointer',
          transition: 'box-shadow 0.15s, border-color 0.15s',
          height: '100%',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
          (e.currentTarget as HTMLDivElement).style.borderColor = '#5a7c5e';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          (e.currentTarget as HTMLDivElement).style.borderColor = '#e4ddd4';
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: '#f0f7f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          {icon}
        </div>
        <div style={{ fontWeight: 600, fontSize: '1rem', color: '#2c2c2c', marginBottom: '0.3rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#888', lineHeight: 1.4 }}>
          {description}
        </div>
      </div>
    </Link>
  );
}

// ── Portal home ───────────────────────────────────────────────────────────────

function PortalHome() {
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
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Customer Portal</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: '#2c2c2c', margin: '0 0 0.5rem' }}>
            Customer Portal
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Welcome. Select a section below.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {/* Brochures card */}
          <PortalCard
            href="/portal/brochures"
            icon={<FileText size={22} style={{ color: '#5a7c5e' }} />}
            title="Brochures"
            description="Download our seasonal wholesale brochures."
          />
          {/* Price Lists card */}
          <PortalCard
            href="/portal/price-lists"
            icon={<List size={22} style={{ color: '#5a7c5e' }} />}
            title="Price Lists"
            description="View and download our current wholesale price lists."
          />
          {/* Order Forms card */}
          <PortalCard
            href="/portal/order-forms"
            icon={<ClipboardList size={22} style={{ color: '#5a7c5e' }} />}
            title="Order Forms"
            description="Browse seasonal collections and submit your wholesale order."
          />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Portal() {
  const queryClient = useQueryClient();

  const { data: auth, isLoading } = useQuery({
    queryKey: ['brochures-auth'],
    queryFn: fetchAuthStatus,
    retry: false,
  });

  const handleUnlocked = () => {
    queryClient.invalidateQueries({ queryKey: ['brochures-auth'] });
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f4' }}>
        <p style={{ color: '#888' }}>Loading…</p>
      </div>
    );
  }

  if (!auth?.authenticated) {
    return <PasswordGate onSuccess={handleUnlocked} />;
  }

  return <PortalHome />;
}
