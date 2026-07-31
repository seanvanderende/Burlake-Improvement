import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KeyRound, ShieldCheck, Eye, EyeOff, AlertTriangle } from 'lucide-react';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

interface PortalSettingsData {
  hasCode: boolean;
  maskedCode: string | null;
  version: string | null;
}

async function fetchPortalSettings(): Promise<PortalSettingsData> {
  const res = await fetch(`${BASE}/api/admin/portal-settings`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load portal settings');
  return res.json();
}

async function updatePortalCode(code: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/portal-settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to update portal code');
  }
}

export default function PortalSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'portal-settings'],
    queryFn: fetchPortalSettings,
  });

  const [newCode, setNewCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const mutation = useMutation({
    mutationFn: updatePortalCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'portal-settings'] });
      setNewCode('');
      setConfirmCode('');
      setFeedback({
        type: 'success',
        message:
          'Portal access code updated. Any buyers currently logged in will need to re-enter the new code.',
      });
    },
    onError: (err: Error) => {
      setFeedback({ type: 'error', message: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newCode.trim().length < 4) {
      setFeedback({ type: 'error', message: 'Code must be at least 4 characters.' });
      return;
    }
    if (newCode !== confirmCode) {
      setFeedback({ type: 'error', message: 'Codes do not match. Please re-enter to confirm.' });
      return;
    }

    mutation.mutate(newCode.trim());
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl text-foreground">Portal Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the Customer Portal access code
        </p>
      </div>

      {/* Current status card */}
      <div className="bg-card border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Current Access Code
        </div>

        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : error ? (
          <p className="text-destructive text-sm">Could not load settings.</p>
        ) : (
          <div className="space-y-1">
            {data?.hasCode ? (
              <p className="font-mono text-base tracking-widest text-foreground">
                {data.maskedCode}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                No code set — portal access is disabled until a code is saved.
              </p>
            )}
            {data?.version && (
              <p className="text-[11px] text-muted-foreground/60">
                Version&nbsp;<span className="font-mono">{data.version.slice(0, 8)}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Change code form */}
      <div className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <KeyRound className="w-4 h-4 text-primary" />
          Set New Access Code
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              New code
            </label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="At least 4 characters"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Confirm new code
            </label>
            <Input
              type={showNew ? 'text' : 'password'}
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Re-enter code to confirm"
              autoComplete="new-password"
            />
          </div>

          {feedback && (
            <div
              className={`flex items-start gap-2 text-sm p-3 border ${
                feedback.type === 'success'
                  ? 'bg-primary/5 border-primary/30 text-primary'
                  : 'bg-destructive/5 border-destructive/30 text-destructive'
              }`}
            >
              {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              {feedback.message}
            </div>
          )}

          <Button type="submit" disabled={mutation.isPending || !newCode}>
            {mutation.isPending ? 'Saving…' : 'Save New Code'}
          </Button>
        </form>
      </div>

      {/* Explanation */}
      <div className="text-sm text-muted-foreground space-y-1 border-t border-border pt-4">
        <p>
          <strong className="text-foreground">How it works:</strong> Buyers enter this code on the
          Customer Portal login page to access brochures, price lists, and order forms.
        </p>
        <p>
          Changing the code revokes access for anyone currently logged in — they will be prompted
          for the new code on their next portal visit.
        </p>
      </div>
    </div>
  );
}
