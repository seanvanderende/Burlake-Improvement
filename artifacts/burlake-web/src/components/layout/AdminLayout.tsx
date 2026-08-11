import React from 'react';
import { Link, useLocation } from 'wouter';
import { useGetAdminSession, useAdminLogout, getGetAdminSessionQueryKey } from '@workspace/api-client-react';
import { LogOut, Leaf, Layers, FileText, ClipboardList, List, BookOpen, KeyRound, BarChart3, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: session, isLoading } = useGetAdminSession({
    query: {
      retry: false,
      queryKey: getGetAdminSessionQueryKey()
    }
  });

  const logoutMutation = useAdminLogout({
    mutation: {
      onSuccess: () => {
        setLocation('/admin/login');
      }
    }
  });

  React.useEffect(() => {
    if (!isLoading && (!session || !session.authenticated)) {
      if (location !== '/admin/login') {
        setLocation('/admin/login');
      }
    }
  }, [session, isLoading, location, setLocation]);

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!session?.authenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-secondary text-secondary-foreground border-b border-border sticky top-0 z-40">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
              <Leaf size={16} />
            </div>
            <Link href="/admin">
              <span className="font-serif text-lg font-medium cursor-pointer">Burlake Admin</span>
            </Link>
            <Link href="/admin/collections">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors cursor-pointer">
                <Layers size={14} /> Collections
              </span>
            </Link>
            <Link href="/admin/brochures">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors cursor-pointer">
                <FileText size={14} /> Brochures
              </span>
            </Link>
            <Link href="/admin/price-lists">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors cursor-pointer">
                <List size={14} /> Price Lists
              </span>
            </Link>
            <Link href="/admin/order-forms">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors cursor-pointer">
                <BookOpen size={14} /> Order Forms
              </span>
            </Link>
            <Link href="/admin/applications">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors cursor-pointer">
                <ClipboardList size={14} /> Applications
              </span>
            </Link>
            <Link href="/admin/portal-settings">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors cursor-pointer">
                <KeyRound size={14} /> Portal
              </span>
            </Link>
            <Link href="/admin/analytics">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors cursor-pointer">
                <BarChart3 size={14} /> Analytics
              </span>
            </Link>
            <Link href="/admin/security">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-secondary-foreground/70 hover:text-secondary-foreground transition-colors cursor-pointer">
                <ShieldCheck size={14} /> Security
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-secondary-foreground/60 hidden sm:inline-block">Staff Session</span>
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
