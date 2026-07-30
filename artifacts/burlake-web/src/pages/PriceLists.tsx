import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, ChevronRight, Leaf, ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'wouter';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface PriceList {
  id: number;
  title: string;
  period: string;
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

async function fetchPriceLists(): Promise<PriceList[]> {
  const res = await fetch(`${BASE}/api/price-lists`);
  if (!res.ok) throw new Error('Failed to fetch price lists');
  return res.json();
}

function groupByPeriod(items: PriceList[]): [string, PriceList[]][] {
  const map = new Map<string, PriceList[]>();
  for (const item of items) {
    if (!map.has(item.period)) map.set(item.period, []);
    map.get(item.period)!.push(item);
  }
  return [...map.entries()];
}

function PriceListCard({ item }: { item: PriceList }) {
  const downloadUrl = `${BASE}/api/price-lists/${item.id}/download`;

  return (
    <a
      href={downloadUrl}
      download={item.fileName}
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
        (e.currentTarget as HTMLAnchorElement).style.borderColor = '#5a7c5e';
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
          background: '#f0f7f1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FileText size={20} style={{ color: '#5a7c5e' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#2c2c2c', marginBottom: '0.15rem' }}>
          {item.title}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#888' }}>
          {new Date(item.createdAt).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}PDF
        </div>
      </div>
      <Download size={16} style={{ color: '#aaa', flexShrink: 0 }} />
    </a>
  );
}

export default function PriceLists() {
  const [, setLocation] = useLocation();

  const { data: auth, isLoading: authLoading } = useQuery({
    queryKey: ['brochures-auth'],
    queryFn: fetchAuthStatus,
    retry: false,
  });

  const { data: priceLists, isLoading: listLoading } = useQuery({
    queryKey: ['price-lists'],
    queryFn: fetchPriceLists,
    enabled: !!auth?.authenticated,
    retry: false,
  });

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

  const grouped = priceLists ? groupByPeriod(priceLists) : [];

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
          <Link href="/portal">
            <span style={{ fontSize: '0.9rem', color: '#5a7c5e', cursor: 'pointer', textDecoration: 'none' }}>
              Customer Portal
            </span>
          </Link>
          <ChevronRight size={14} style={{ color: '#bbb' }} />
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Price Lists</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <Link href="/portal">
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'none',
                border: '1px solid #e4ddd4',
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.82rem',
                color: '#666',
                cursor: 'pointer',
                marginTop: '0.35rem',
              }}
            >
              <ArrowLeft size={13} /> Portal
            </button>
          </Link>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2rem', color: '#2c2c2c', margin: '0 0 0.5rem' }}>
              Price Lists
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Download our current wholesale price lists.
            </p>
          </div>
        </div>

        {listLoading ? (
          <p style={{ color: '#aaa' }}>Loading price lists…</p>
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
            No price lists available yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {grouped.map(([period, items]) => (
              <div key={period}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#5a7c5e',
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
                    {period}
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {items.map((item) => (
                    <PriceListCard key={item.id} item={item} />
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
