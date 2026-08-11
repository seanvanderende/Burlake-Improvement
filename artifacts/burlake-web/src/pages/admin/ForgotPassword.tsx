import React from 'react';
import { Link, useLocation } from 'wouter';
import { useForgotAdminPassword } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminForgotPassword() {
  const [, setLocation] = useLocation();
  const [recoveryCode, setRecoveryCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const resetMutation = useForgotAdminPassword({
    mutation: {
      onSuccess: () => {
        setLocation('/admin');
      },
      onError: (err: unknown) => {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          'Invalid or already-used recovery code.';
        setError(message);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 4) {
      setError('New password must be at least 4 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    resetMutation.mutate({ data: { recoveryCode: recoveryCode.trim(), newPassword } });
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="w-full max-w-md bg-background border border-border p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-foreground mb-2">Reset Password</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Using Recovery Code</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recoveryCode" className="text-xs uppercase tracking-wider text-muted-foreground">
              Recovery Code
            </Label>
            <Input
              id="recoveryCode"
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              required
              className="bg-transparent font-mono tracking-widest"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-xs uppercase tracking-wider text-muted-foreground">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="bg-transparent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-transparent"
            />
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 border border-destructive/20">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
            {resetMutation.isPending ? 'Resetting…' : 'Reset Password & Sign In'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Back to Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}
