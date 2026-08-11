import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ClipboardList, ChevronRight, CalendarDays } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface OrderForm {
  id: number;
  title: string;
  customerName: string;
  description: string | null;
  season: string | null;
  deadline: string | null;
  status: string;
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

export default function OrderForms() {
  const [, setLocation] = useLocation();

  const { data: auth, isLoading: authLoading } = useQuery({
    queryKey: ['brochures-auth'],
    queryFn: fetchAuthStatus,
    retry: false,
  });

  const { data: forms, isLoading, error } = useQuery<OrderForm[]>({
    queryKey: ['portal-order-forms'],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/order-forms`);
      if (!res.ok) throw new Error('Failed to load order forms');
      return res.json();
    },
    enabled: !!auth?.authenticated,
    retry: false,
  });

  // Redirect to portal if not authenticated
  useEffect(() => {
    if (!authLoading && !auth?.authenticated) {
      setLocation('/portal');
    }
  }, [auth, authLoading, setLocation]);

  if (authLoading || !auth?.authenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f4' }}>
        <p style={{ color: '#888' }}>Loading…</p>
      </div>
    );
  }

  const container: React.CSSProperties = {
    minHeight: '100vh',
    background: '#faf8f4',
    paddingTop: '5rem',
  };

  const inner: React.CSSProperties = {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  };

  return (
    <div style={container}>
      <div style={inner}>
        <div style={{ marginBottom: '0.5rem' }}>
          <Link href="/portal" style={{ fontSize: '0.82rem', color: '#5a7c5e', textDecoration: 'none' }}>← Customer Portal</Link>
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: '#1a2e1a', margin: '0.5rem 0 0.4rem' }}>Order Forms</h1>
        <p style={{ color: '#777', fontSize: '0.95rem', margin: '0 0 2rem' }}>
          Select a form below to browse available products and submit your order.
        </p>

        {isLoading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>Loading…</div>
        )}

        {error && (
          <div style={{ padding: '1.5rem', background: '#fff5f5', border: '1px solid #f5c6c6', borderRadius: '8px', color: '#c0392b', fontSize: '0.9rem' }}>
            Could not load order forms. Please try again.
          </div>
        )}

        {forms && forms.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa', background: '#fff', border: '1px solid #e4ddd4', borderRadius: '10px', fontSize: '0.9rem' }}>
            No order forms are currently available. Check back soon.
          </div>
        )}

        {forms && forms.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {forms.map(form => (
              <Link key={form.id} href={`/portal/order-forms/${form.id}`}>
                <div style={{
                  background: '#fff',
                  border: '1px solid #e4ddd4',
                  borderRadius: '10px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.15s, border-color 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = '#b8d4ba'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.borderColor = '#e4ddd4'; }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eef6ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClipboardList size={20} style={{ color: '#3a7d44' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#1a2e1a', fontSize: '0.95rem', marginBottom: '0.2rem' }}>{form.title}</div>
                    <div style={{ fontSize: '0.83rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {form.season && <span>{form.season}</span>}
                      {form.deadline && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CalendarDays size={12} /> Order by {new Date(form.deadline + 'T00:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {form.description && <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: '#666' }}>{form.description}</p>}
                  </div>
                  <ChevronRight size={18} style={{ color: '#bbb', flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
