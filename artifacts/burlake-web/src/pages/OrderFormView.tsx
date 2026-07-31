import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { Download, Printer, Mail } from 'lucide-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderFormItem {
  id: number;
  name: string;
  itemNum: string | null;
  upc: string | null;
  pack: string | null;
  casePrice: string | null;
  category: string | null;
  sortOrder: number;
}

interface OrderFormData {
  id: number;
  title: string;
  customerName: string;
  description: string | null;
  season: string | null;
  deadline: string | null;
  replyToEmail: string | null;
  items: OrderFormItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const money = (n: number) => '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const num = (n: number) => n.toLocaleString();

function parseUnitsPerCase(pack: string | null): number {
  if (!pack) return 1;
  const m = pack.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

function makeOrderId() {
  return 'BL' + Date.now().toString(36).toUpperCase();
}

// ── Quantity stepper ──────────────────────────────────────────────────────────

function QtyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', width: 'fit-content' }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{ width: '32px', height: '32px', background: value > 0 ? '#f0f4f0' : '#fafafa', border: 'none', cursor: value > 0 ? 'pointer' : 'default', fontSize: '1rem', color: value > 0 ? '#2c5e2e' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >−</button>
      <input
        type="number"
        min="0"
        value={value || ''}
        placeholder="0"
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        style={{ width: '44px', height: '32px', textAlign: 'center', border: 'none', borderLeft: '1px solid #e8e8e8', borderRight: '1px solid #e8e8e8', fontSize: '0.88rem', fontWeight: value > 0 ? 600 : 400, color: value > 0 ? '#1a3a1c' : '#aaa', background: '#fff', outline: 'none' }}
      />
      <button
        onClick={() => onChange(value + 1)}
        style={{ width: '32px', height: '32px', background: '#f0f4f0', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#2c5e2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >+</button>
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ item, qty, onQtyChange }: { item: OrderFormItem; qty: number; onQtyChange: (v: number) => void }) {
  const price = item.casePrice ? parseFloat(item.casePrice) : null;
  const lineTotal = price && qty > 0 ? price * qty : null;
  const selected = qty > 0;

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${selected ? '#7cb87f' : '#e4ddd4'}`,
      borderRadius: '10px',
      overflow: 'hidden',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      boxShadow: selected ? '0 2px 12px rgba(60,120,60,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {/* Color bar when selected */}
      <div style={{ height: '3px', background: selected ? '#3a7d44' : 'transparent', transition: 'background 0.15s' }} />
      <div style={{ padding: '1rem' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a2e1a', lineHeight: 1.3, marginBottom: '0.5rem' }}>{item.name}</div>
        <div style={{ fontSize: '0.75rem', color: '#999', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {item.itemNum && <span style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: '4px' }}>ITEM {item.itemNum}</span>}
          {item.pack && <span>PACK {item.pack}</span>}
          {item.upc && <span style={{ fontFamily: 'monospace' }}>UPC {item.upc}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            {price != null ? (
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2c5e2e' }}>
                {money(price)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#999' }}>/ case</span>
              </div>
            ) : <div style={{ fontSize: '0.82rem', color: '#bbb' }}>Price TBD</div>}
            {lineTotal != null && (
              <div style={{ fontSize: '0.78rem', color: '#5a7c5e', fontWeight: 500 }}>{money(lineTotal)} total</div>
            )}
          </div>
          <QtyInput value={qty} onChange={onQtyChange} />
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = useCallback((m: string) => {
    setMsg(m);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(''), 3000);
  }, []);
  return { msg, toast };
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function OrderFormView() {
  const params = useParams<{ id: string }>();
  const formId = params.id;

  const { data: form, isLoading, error } = useQuery<OrderFormData>({
    queryKey: ['portal-order-form', formId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/order-forms/${formId}`);
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to load'); }
      return res.json();
    },
    enabled: !!formId,
  });

  const [qty, setQty] = useState<Record<number, number>>({});
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState<string>('All');
  const [selectedOnly, setSelectedOnly] = useState(false);

  // Order detail fields
  const [store, setStore] = useState('');
  const [buyer, setBuyer] = useState('');
  const [email, setEmail] = useState('');
  const [po, setPo] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const { msg: toastMsg, toast } = useToast();
  const orderIdRef = useRef(makeOrderId());

  // Derive categories
  const categories = useMemo(() => {
    if (!form) return [];
    const cats = new Set<string>();
    form.items.forEach(it => { if (it.category) cats.add(it.category); });
    return Array.from(cats).sort();
  }, [form]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!form) return [];
    const q = search.toLowerCase();
    return form.items.filter(it => {
      if (activeChip !== 'All' && it.category !== activeChip) return false;
      if (selectedOnly && !(qty[it.id] > 0)) return false;
      if (q && !(`${it.name} ${it.itemNum ?? ''} ${it.upc ?? ''}`).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [form, qty, search, activeChip, selectedOnly]);

  // Totals
  const totals = useMemo(() => {
    if (!form) return { items: 0, cases: 0, units: 0, total: 0 };
    let items = 0, cases = 0, units = 0, total = 0;
    form.items.forEach(it => {
      const q = qty[it.id] ?? 0;
      if (q > 0) {
        items++;
        cases += q;
        units += q * parseUnitsPerCase(it.pack);
        total += q * (it.casePrice ? parseFloat(it.casePrice) : 0);
      }
    });
    return { items, cases, units, total };
  }, [form, qty]);

  const setItemQty = useCallback((id: number, v: number) => {
    setQty(prev => ({ ...prev, [id]: v }));
  }, []);

  const clearAll = () => {
    if (Object.values(qty).every(v => !v)) return;
    if (!confirm('Clear all selected quantities?')) return;
    setQty({});
  };

  // Group filtered items by category
  const grouped = useMemo(() => {
    const map: Record<string, OrderFormItem[]> = {};
    filteredItems.forEach(it => {
      const key = it.category || 'Other';
      if (!map[key]) map[key] = [];
      map[key].push(it);
    });
    return map;
  }, [filteredItems]);

  const groupOrder = useMemo(() => {
    if (!form) return [];
    const seen = new Set<string>();
    const order: string[] = [];
    form.items.forEach(it => {
      const k = it.category || 'Other';
      if (!seen.has(k)) { seen.add(k); order.push(k); }
    });
    return order.filter(k => grouped[k]);
  }, [form, grouped]);

  const selectedLines = useMemo(() => {
    if (!form) return [];
    return form.items.filter(it => (qty[it.id] ?? 0) > 0);
  }, [form, qty]);

  // Shared validation — highlights required fields and returns false if anything is missing.
  // Also scrolls the order-details section into view so the buyer can see the errors.
  const validateOrderDetails = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!store.trim()) errors.store = true;
    if (!buyer.trim()) errors.buyer = true;
    if (!email.trim()) errors.email = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast('Please fill in the required fields below');
      document.getElementById('order-details-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const emailOrder = () => {
    if (!form) return;
    if (!hasSelection) { toast('Select some items first'); return; }
    if (!validateOrderDetails()) return;

    const pad = (s: string, w: number) => s.slice(0, w).padEnd(w);
    const lines: string[] = [];

    lines.push(`${form.title}`);
    if (form.season && form.season !== form.title) lines.push(form.season);
    lines.push(`Burnaby Lake Greenhouses — Order Form`);
    lines.push(`Order ID: ${orderIdRef.current}`);
    lines.push('');

    if (store)        lines.push(`Store / Location:    ${store}`);
    if (buyer)        lines.push(`Buyer Name:          ${buyer}`);
    if (email)        lines.push(`Email:               ${email}`);
    if (po)           lines.push(`PO #:                ${po}`);
    if (deliveryDate) lines.push(`Requested Delivery:  ${deliveryDate}`);
    if (notes)        lines.push(`Notes:               ${notes}`);
    lines.push('');

    lines.push('SELECTIONS');
    lines.push('─'.repeat(72));
    lines.push(
      pad('Item Name', 30) + '  ' +
      pad('Item #', 10) + '  ' +
      pad('Pack', 10) + '  ' +
      'Cases'.padStart(6) + '  ' +
      'Line Total'.padStart(10)
    );
    lines.push('─'.repeat(72));

    selectedLines.forEach(it => {
      const q = qty[it.id];
      const price = it.casePrice ? parseFloat(it.casePrice) : 0;
      lines.push(
        pad(it.name, 30) + '  ' +
        pad(it.itemNum ?? '—', 10) + '  ' +
        pad(it.pack ?? '—', 10) + '  ' +
        String(q).padStart(6) + '  ' +
        (price ? money(q * price) : '—').padStart(10)
      );
    });

    lines.push('─'.repeat(72));
    lines.push(
      pad(`TOTAL — ${totals.items} item${totals.items !== 1 ? 's' : ''}`, 54) +
      String(totals.cases).padStart(6) + '  ' +
      money(totals.total).padStart(10)
    );
    lines.push('');
    lines.push(`${totals.cases} case${totals.cases !== 1 ? 's' : ''}, ${num(totals.units)} unit${totals.units !== 1 ? 's' : ''}`);

    const subject = `Order ${orderIdRef.current} — ${form.title}${store ? ` · ${store}` : ''}`;
    const fullBody = lines.join('\n');
    const to = form.replyToEmail ?? '';

    // mailto: has practical URL-length limits (~2000 chars for the encoded body).
    // If the order fits, send it inline. If it's too large, download the CSV first
    // and open a short email asking the buyer to attach it — no false claims about
    // attachments that mailto cannot provide.
    const encodedBody = encodeURIComponent(fullBody);
    const encodedSubject = encodeURIComponent(subject);
    const encodedTo = encodeURIComponent(to);

    if (encodedBody.length <= 1800) {
      window.location.href = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`;
      toast('Opening your email client…');
    } else {
      // Order too large for inline email — download the CSV so the buyer can attach it,
      // then open a short email with totals only and instructions.
      downloadCSV();
      const shortBody = [
        subject,
        '',
        `Store / Location:  ${store}`,
        `Buyer Name:        ${buyer}`,
        `PO #:              ${po || '—'}`,
        `Requested Delivery: ${deliveryDate || '—'}`,
        '',
        `SUMMARY`,
        `Items:  ${totals.items}`,
        `Cases:  ${totals.cases}`,
        `Units:  ${totals.units}`,
        `Total:  ${money(totals.total)}`,
        '',
        'The full itemized order has been downloaded as a CSV file.',
        'Please attach it to this email before sending.',
      ].join('\n');
      window.location.href = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodeURIComponent(shortBody)}`;
      toast('Order too large for inline email — CSV downloaded. Please attach it to your email.');
    }
  };

  const downloadCSV = () => {
    if (!selectedLines.length) { toast('Select some items first'); return; }
    const header = ['Order ID', 'Store / Location', 'Buyer', 'Email', 'PO #', 'Requested Delivery', 'Item Name', 'Item #', 'UPC', 'Pack', 'Cases', 'Units', 'Case Price', 'Line Total'];
    const rows = selectedLines.map(it => {
      const q = qty[it.id];
      const units = q * parseUnitsPerCase(it.pack);
      const price = it.casePrice ? parseFloat(it.casePrice) : 0;
      return [orderIdRef.current, store, buyer, email, po, deliveryDate, it.name, it.itemNum ?? '', it.upc ?? '', it.pack ?? '', q, units, price.toFixed(2), (q * price).toFixed(2)];
    });
    rows.push([]);
    rows.push(['', '', '', '', '', '', '', '', '', 'TOTAL', totals.cases, totals.units, '', totals.total.toFixed(2)]);
    const esc = (c: unknown) => { const s = String(c ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [header, ...rows].map(r => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `Order_${orderIdRef.current}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast('CSV downloaded');
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f4' }}>
        <p style={{ color: '#aaa' }}>Loading…</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div style={{ minHeight: '100vh', background: '#faf8f4', paddingTop: '5rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
          <p style={{ color: '#c0392b' }}>{(error as Error)?.message || 'Form not found.'}</p>
          <Link href="/portal/order-forms" style={{ color: '#5a7c5e' }}>← Back to Order Forms</Link>
        </div>
      </div>
    );
  }

  const hasSelection = totals.items > 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f4', paddingTop: '4rem' }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: '#1a2e1a', color: '#fff', padding: '0.6rem 1.25rem', borderRadius: '20px', fontSize: '0.85rem', zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toastMsg}
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {/* Brand header */}
      <div style={{ background: 'linear-gradient(180deg, #1a3320, #0f2318)', color: '#fff', padding: '1.5rem 1.5rem 1.25rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="no-print" style={{ marginBottom: '0.75rem' }}>
            <Link href="/portal/order-forms" style={{ fontSize: '0.8rem', color: '#88b88a', textDecoration: 'none' }}>← Order Forms</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.3em', color: '#88b88a', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                {form.customerName} · Order Form
              </div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.04em', color: '#f0f7f0' }}>{form.title}</h1>
              {form.season && <div style={{ fontSize: '0.83rem', color: '#88b88a', marginTop: '0.25rem' }}>{form.season}</div>}
              {form.description && <div style={{ fontSize: '0.83rem', color: '#aad4ac', marginTop: '0.35rem', maxWidth: '600px' }}>{form.description}</div>}
            </div>
            {form.deadline && (
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.6rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', letterSpacing: '0.2em', color: '#88b88a', textTransform: 'uppercase' }}>Order Deadline</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8c872', marginTop: '0.2rem' }}>
                  {new Date(form.deadline + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky summary bar */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e8ece8', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', padding: '0.75rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { value: num(totals.items), label: 'items' },
            { value: num(totals.cases), label: 'cases' },
            { value: num(totals.units), label: 'units' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a3320', fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999' }}>{s.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: '#2c6e35', fontVariantNumeric: 'tabular-nums' }}>{money(totals.total)}</span>
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999' }}>est. total</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={clearAll} style={{ padding: '0.45rem 0.9rem', border: '1px solid #ddd', borderRadius: '7px', background: '#fff', color: '#888', fontSize: '0.82rem', cursor: 'pointer' }}>Clear</button>
          <button onClick={downloadCSV} disabled={!hasSelection} style={{ padding: '0.45rem 0.9rem', border: '1px solid #3a7d44', borderRadius: '7px', background: '#fff', color: '#3a7d44', fontSize: '0.82rem', cursor: hasSelection ? 'pointer' : 'default', opacity: hasSelection ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Download size={13} /> CSV
          </button>
          <button onClick={emailOrder} disabled={!hasSelection} style={{ padding: '0.45rem 0.9rem', border: '1px solid #3a7d44', borderRadius: '7px', background: '#fff', color: '#3a7d44', fontSize: '0.82rem', cursor: hasSelection ? 'pointer' : 'default', opacity: hasSelection ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Mail size={13} /> Email
          </button>
          <button onClick={() => window.print()} style={{ padding: '0.45rem 0.9rem', border: '1px solid #ddd', borderRadius: '7px', background: '#fff', color: '#555', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="no-print" style={{ maxWidth: '1200px', margin: '1.25rem auto 0', padding: '0 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, item # or UPC…"
            style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.85rem', background: '#fff', color: '#333', outline: 'none' }}
          />
        </div>
        {/* Category chips */}
        {categories.length > 1 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveChip(cat)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: activeChip === cat ? '#3a7d44' : '#ddd',
                  background: activeChip === cat ? '#3a7d44' : '#fff',
                  color: activeChip === cat ? '#fff' : '#666',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontWeight: activeChip === cat ? 600 : 400,
                  transition: 'all 0.12s',
                }}
              >{cat}</button>
            ))}
          </div>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', color: '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={selectedOnly} onChange={e => setSelectedOnly(e.target.checked)} style={{ accentColor: '#3a7d44' }} />
          Selected only
        </label>
        <span style={{ fontSize: '0.8rem', color: '#bbb', whiteSpace: 'nowrap' }}>
          {filteredItems.length} of {form.items.length} items
        </span>
      </div>

      {/* Product grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 2rem' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa', fontSize: '0.9rem', marginTop: '1.5rem' }}>No items match your search.</div>
        ) : (
          groupOrder.map(group => (
            <div key={group}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a3320', whiteSpace: 'nowrap' }}>{group}</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, #3a7d4440, transparent)' }} />
              </div>
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {(grouped[group] ?? []).map(item => (
                  <ProductCard key={item.id} item={item} qty={qty[item.id] ?? 0} onQtyChange={v => setItemQty(item.id, v)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order summary table (print + always visible) */}
      {hasSelection && (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 1.5rem' }}>
          <div style={{ background: '#fff', border: '1px solid #e4ddd4', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f0ebe3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#2c2c2c' }}>Your Selections</h2>
              <span style={{ fontSize: '0.82rem', color: '#aaa' }}>{totals.items} item{totals.items !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#faf8f4' }}>
                    {['Item Name', 'Item #', 'UPC', 'Pack', 'Cases', 'Units', 'Case Price', 'Line Total'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: h === 'Cases' || h === 'Units' || h === 'Case Price' || h === 'Line Total' ? 'right' : 'left', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', borderBottom: '1px solid #e4ddd4', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedLines.map(it => {
                    const q = qty[it.id];
                    const price = it.casePrice ? parseFloat(it.casePrice) : 0;
                    const units = q * parseUnitsPerCase(it.pack);
                    return (
                      <tr key={it.id} style={{ borderBottom: '1px solid #f7f4f0' }}>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#1a2e1a', fontWeight: 500 }}>{it.name}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#888' }}>{it.itemNum ?? '—'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#888', fontFamily: 'monospace', fontSize: '0.78rem' }}>{it.upc ?? '—'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', color: '#888' }}>{it.pack ?? '—'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>{num(q)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#666' }}>{num(units)}</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', color: '#666' }}>{price ? money(price) : '—'}</td>
                        <td style={{ padding: '0.65rem 0.75rem', textAlign: 'right', fontWeight: 600, color: '#2c5e2e' }}>{price ? money(q * price) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f0f7f0', borderTop: '2px solid #d0e8d2' }}>
                    <td colSpan={4} style={{ padding: '0.75rem', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.05em', color: '#1a3320' }}>
                      TOTAL — {totals.items} item{totals.items !== 1 ? 's' : ''}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#1a3320' }}>{num(totals.cases)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: '#1a3320' }}>{num(totals.units)}</td>
                    <td style={{ padding: '0.75rem' }} />
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: '#2c6e35' }}>{money(totals.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order details form */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 3rem' }}>
        <div id="order-details-section" style={{ background: '#fff', border: '1px solid #e4ddd4', borderRadius: '10px', padding: '1.5rem', marginTop: '0.5rem' }}>
          <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 600, color: '#2c2c2c', fontFamily: 'Georgia, serif' }}>Order Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {[
              { id: 'store', label: 'Store / Location *', placeholder: 'e.g. Sobeys #1234 — Burnaby', val: store, set: setStore, required: true },
              { id: 'buyer', label: 'Buyer Name *', placeholder: 'Full name', val: buyer, set: setBuyer, required: true },
              { id: 'email', label: 'Email *', placeholder: 'name@example.com', val: email, set: setEmail, type: 'email', required: true },
              { id: 'po', label: 'PO Number', placeholder: 'Optional', val: po, set: setPo, required: false },
              { id: 'delivery', label: 'Requested Delivery', placeholder: '', val: deliveryDate, set: setDeliveryDate, type: 'date', required: false },
            ].map(f => (
              <div key={f.id}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: fieldErrors[f.id] ? '#c0392b' : '#555', marginBottom: '0.3rem' }}>{f.label}</label>
                <input
                  type={(f as { type?: string }).type ?? 'text'}
                  value={f.val}
                  onChange={e => { f.set(e.target.value); if (fieldErrors[f.id]) setFieldErrors(prev => ({ ...prev, [f.id]: false })); }}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1px solid ${fieldErrors[f.id] ? '#e57373' : '#e0d9d0'}`, borderRadius: '6px', fontSize: '0.88rem', color: '#333', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#555', marginBottom: '0.3rem' }}>Notes / Special Instructions</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Delivery instructions, substitution preferences, etc."
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #e0d9d0', borderRadius: '6px', fontSize: '0.88rem', color: '#333', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => {
                if (!hasSelection) { toast('Select some items first'); return; }
                if (!validateOrderDetails()) return;
                downloadCSV();
              }}
              style={{ padding: '0.6rem 1.4rem', background: '#3a7d44', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={15} /> Download Order (CSV)
            </button>
            <button
              onClick={emailOrder}
              style={{ padding: '0.6rem 1.1rem', border: '1px solid #3a7d44', borderRadius: '8px', background: '#fff', color: '#3a7d44', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Mail size={14} /> Email Order
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: '0.6rem 1.1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fff', color: '#555', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={14} /> Print
            </button>
            <span style={{ fontSize: '0.8rem', color: '#bbb' }}>Order ID: {orderIdRef.current}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
