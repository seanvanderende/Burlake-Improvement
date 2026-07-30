import React from 'react';
import { useListApplications, useUpdateApplication, getListApplicationsQueryKey } from '@workspace/api-client-react';
import type { Application } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: {
    label: 'Pending',
    icon: <Clock size={12} />,
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle2 size={12} />,
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle size={12} />,
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  'garden-center': 'Independent Garden Center',
  florist: 'Retail Florist',
  grocery: 'Grocery / Supermarket',
  hardware: 'Hardware / Box Store',
  other: 'Other',
};

function ApplicationRow({ app }: { app: Application }) {
  const [expanded, setExpanded] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useUpdateApplication({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListApplicationsQueryKey() });
        toast({ title: 'Application updated' });
      },
      onError: () => {
        toast({ title: 'Update failed', variant: 'destructive' });
      },
    },
  });

  const statusConfig = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending;

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {/* Row header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-foreground truncate">{app.businessName}</span>
            <span
              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${statusConfig.className}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {app.contactName} · {app.email}
            {app.businessType && (
              <> · {BUSINESS_TYPE_LABELS[app.businessType] ?? app.businessType}</>
            )}
          </p>
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
          {new Date(app.createdAt).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
        <span className="text-muted-foreground ml-2">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-border bg-muted/10">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-4 text-sm">
            <div>
              <dt className="text-muted-foreground font-medium">Business Name</dt>
              <dd className="text-foreground mt-0.5">{app.businessName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Business Type</dt>
              <dd className="text-foreground mt-0.5">
                {BUSINESS_TYPE_LABELS[app.businessType] ?? app.businessType}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Contact Name</dt>
              <dd className="text-foreground mt-0.5">{app.contactName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Email</dt>
              <dd className="text-foreground mt-0.5">
                <a href={`mailto:${app.email}`} className="underline hover:text-primary">
                  {app.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Phone</dt>
              <dd className="text-foreground mt-0.5">
                <a href={`tel:${app.phone}`} className="underline hover:text-primary">
                  {app.phone}
                </a>
              </dd>
            </div>
            {app.monthlyVolume && (
              <div>
                <dt className="text-muted-foreground font-medium">Monthly Volume</dt>
                <dd className="text-foreground mt-0.5">{app.monthlyVolume}</dd>
              </div>
            )}
            {app.notes && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground font-medium">Notes</dt>
                <dd className="text-foreground mt-0.5 whitespace-pre-wrap">{app.notes}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground font-medium">Submitted</dt>
              <dd className="text-foreground mt-0.5">
                {new Date(app.createdAt).toLocaleString('en-CA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </dd>
            </div>
          </dl>

          {/* Status actions */}
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground font-medium">Update status:</span>
            {app.status !== 'approved' && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: app.id, data: { status: 'approved' } })}
              >
                <CheckCircle2 size={14} className="mr-1.5" />
                Approve
              </Button>
            )}
            {app.status !== 'rejected' && (
              <Button
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-50"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: app.id, data: { status: 'rejected' } })}
              >
                <XCircle size={14} className="mr-1.5" />
                Reject
              </Button>
            )}
            {app.status !== 'pending' && (
              <Button
                size="sm"
                variant="outline"
                className="text-amber-700 border-amber-300 hover:bg-amber-50"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate({ id: app.id, data: { status: 'pending' } })}
              >
                <Clock size={14} className="mr-1.5" />
                Reset to Pending
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminApplications() {
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { data: applications, isLoading, error } = useListApplications();

  const filtered = React.useMemo(() => {
    if (!applications) return [];
    if (statusFilter === 'all') return applications;
    return applications.filter((a) => a.status === statusFilter);
  }, [applications, statusFilter]);

  const counts = React.useMemo(() => {
    if (!applications) return { all: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
  }, [applications]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl text-foreground">Wholesale Applications</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage account applications from prospective buyers.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              statusFilter === s
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-60">{counts[s]}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-16 text-muted-foreground">Loading applications…</div>
      )}

      {error && (
        <div className="text-center py-16 text-destructive">
          Failed to load applications. Please refresh.
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          {statusFilter === 'all'
            ? 'No applications yet.'
            : `No ${statusFilter} applications.`}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationRow key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
