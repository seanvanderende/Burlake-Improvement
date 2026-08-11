import React from 'react';
import { useListUnsubscribeRequests } from '@workspace/api-client-react';

export default function AdminUnsubscribeRequests() {
  const { data: requests, isLoading, error } = useListUnsubscribeRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">Unsubscribe Requests</h1>
        <p className="text-muted-foreground mt-1">
          Customers who've asked to be removed from our mailing lists.
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-16 text-muted-foreground">Loading requests…</div>
      )}

      {error && (
        <div className="text-center py-16 text-destructive">
          Failed to load requests. Please refresh.
        </div>
      )}

      {!isLoading && !error && requests && requests.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">No unsubscribe requests yet.</div>
      )}

      {!isLoading && requests && requests.length > 0 && (
        <div className="bg-background border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="text-left px-6 py-3 font-medium">Business Name / Account #</th>
                <th className="text-left px-6 py-3 font-medium">Email</th>
                <th className="text-left px-6 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-6 py-4 text-foreground">{r.businessNameOrAccountNumber}</td>
                  <td className="px-6 py-4">
                    <a
                      href={`mailto:${r.email}`}
                      className="underline hover:text-primary text-foreground"
                    >
                      {r.email}
                    </a>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString('en-CA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
