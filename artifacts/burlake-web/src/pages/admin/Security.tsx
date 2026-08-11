import React, { useState } from 'react';
import {
  useChangeAdminPassword,
  useGetAdminRecoveryCodeStatus,
  useGenerateAdminRecoveryCode,
  getGetAdminRecoveryCodeStatusQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, ShieldCheck, AlertTriangle, Copy, Check, LifeBuoy } from 'lucide-react';

export default function AdminSecurity() {
  const queryClient = useQueryClient();

  // --- Change password ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const changePasswordMutation = useChangeAdminPassword({
    mutation: {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordFeedback({ type: 'success', message: 'Password updated.' });
      },
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Failed to change password.';
        setPasswordFeedback({ type: 'error', message });
      },
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 4) {
      setPasswordFeedback({ type: 'error', message: 'New password must be at least 4 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    changePasswordMutation.mutate({ data: { currentPassword, newPassword } });
  };

  // --- Recovery code ---
  const { data: recoveryStatus, isLoading: statusLoading } = useGetAdminRecoveryCodeStatus();
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateCodeMutation = useGenerateAdminRecoveryCode({
    mutation: {
      onSuccess: (data) => {
        setRevealedCode(data.code);
        setCopied(false);
        queryClient.invalidateQueries({ queryKey: getGetAdminRecoveryCodeStatusQueryKey() });
      },
    },
  });

  const handleCopy = async () => {
    if (!revealedCode) return;
    await navigator.clipboard.writeText(revealedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Account Security</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the staff login password and recovery code
        </p>
      </div>

      {/* Change password */}
      <div className="bg-card border border-border p-6 space-y-6">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <KeyRound className="w-4 h-4 text-primary" />
          Change Password
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Current password</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">New password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 4 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Confirm new password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {passwordFeedback && (
            <div
              className={`flex items-start gap-2 text-sm p-3 border ${
                passwordFeedback.type === 'success'
                  ? 'bg-primary/5 border-primary/30 text-primary'
                  : 'bg-destructive/5 border-destructive/30 text-destructive'
              }`}
            >
              {passwordFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
              {passwordFeedback.message}
            </div>
          )}

          <Button type="submit" disabled={changePasswordMutation.isPending || !currentPassword || !newPassword}>
            {changePasswordMutation.isPending ? 'Saving…' : 'Save New Password'}
          </Button>
        </form>
      </div>

      {/* Recovery code */}
      <div className="bg-card border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <LifeBuoy className="w-4 h-4 text-primary" />
          Recovery Code
        </div>

        {statusLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <div className="space-y-1">
            {recoveryStatus?.hasRecoveryCode ? (
              <p className="flex items-center gap-2 text-sm text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />A recovery code is set and ready to use.
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground italic">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                No recovery code set — if the password is forgotten, nobody can get back in without a developer.
              </p>
            )}
          </div>
        )}

        {revealedCode && (
          <div className="bg-primary/5 border border-primary/30 p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              New recovery code — save this now, it will not be shown again
            </p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-lg tracking-widest text-foreground bg-background px-3 py-2 border border-border flex-1">
                {revealedCode}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => generateCodeMutation.mutate()}
          disabled={generateCodeMutation.isPending}
        >
          {generateCodeMutation.isPending
            ? 'Generating…'
            : recoveryStatus?.hasRecoveryCode
              ? 'Generate New Code (replaces the old one)'
              : 'Generate Recovery Code'}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground space-y-1 border-t border-border pt-4">
        <p>
          <strong className="text-foreground">How it works:</strong> If staff forget the login password, use the
          recovery code on the login page's "Forgot password?" link to set a new one without a developer.
        </p>
        <p>Each recovery code works once. Generate a new one right after using it.</p>
      </div>
    </div>
  );
}
