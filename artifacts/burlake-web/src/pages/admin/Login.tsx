import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAdminLogin } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  
  const loginMutation = useAdminLogin({
    mutation: {
      onSuccess: () => {
        setLocation('/admin');
      },
      onError: () => {
        setError('Incorrect password');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ data: { password } });
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="w-full max-w-md bg-background border border-border p-10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl text-foreground mb-2">Staff Login</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">Inventory Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Admin Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-transparent"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 border border-destructive/20">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full"
            disabled={loginMutation.isPending || !password}
          >
            {loginMutation.isPending ? 'Authenticating...' : 'Access Dashboard'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/admin/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Forgot password?
          </Link>
        </div>

        <div className="mt-4 pt-6 border-t border-border text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Return to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
