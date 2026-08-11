import React, { useState } from 'react';
import { useGetAnalyticsSummary } from '@workspace/api-client-react';
import { BarChart3, Eye, TrendingUp, FileText, Loader2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type Range = 'daily' | 'weekly' | 'monthly';

const RANGE_LABEL: Record<Range, string> = {
  daily: 'Last 30 days',
  weekly: 'Last 12 weeks',
  monthly: 'Last 12 months',
};

export default function AdminAnalytics() {
  const { data: summary, isLoading, error } = useGetAnalyticsSummary();
  const [range, setRange] = useState<Range>('daily');

  const buckets = summary?.[range] ?? [];
  const totalAllTime = summary
    ? summary.daily.reduce((sum, b) => sum + b.count, 0)
    : 0;
  const totalInRange = buckets.reduce((sum, b) => sum + b.count, 0);
  const todayCount = summary?.daily.at(-1)?.count ?? 0;
  const avgPerDay = summary && summary.daily.length > 0
    ? Math.round((summary.daily.reduce((s, b) => s + b.count, 0) / summary.daily.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary shrink-0">
          <BarChart3 size={16} />
        </div>
        <div>
          <h1 className="font-serif text-3xl text-foreground">Site Traffic</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Page views across the public site. No visitor identifiers are collected — just counts.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading traffic data…
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-md">
          Failed to load traffic data. Try refreshing the page.
        </div>
      )}

      {summary && (
        <>
          {/* Basic stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={<Eye size={16} />}
              label="Views today"
              value={todayCount}
            />
            <StatCard
              icon={<TrendingUp size={16} />}
              label="Avg. views / day (last 30d)"
              value={avgPerDay}
            />
            <StatCard
              icon={<BarChart3 size={16} />}
              label="Total views (last 30d)"
              value={totalAllTime}
            />
          </div>

          {/* Chart with range toggle */}
          <div className="bg-card border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-medium text-foreground">Page views over time</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{RANGE_LABEL[range]} — {totalInRange} total</p>
              </div>
              <div className="flex gap-1 bg-muted/40 p-1 rounded-md">
                {(['daily', 'weekly', 'monthly'] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                      range === r
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {r === 'daily' ? 'Daily' : r === 'weekly' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Bar dataKey="count" name="Views" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top pages */}
          <div className="bg-card border border-border">
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <FileText size={14} className="text-muted-foreground" />
              <h2 className="font-medium text-foreground text-sm">Most visited pages (all time)</h2>
            </div>
            {summary.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5">No page views recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {summary.topPages.map((p) => {
                    const max = summary.topPages[0]?.count || 1;
                    const pct = Math.max(4, Math.round((p.count / max) * 100));
                    return (
                      <tr key={p.path}>
                        <td className="px-5 py-2.5 font-mono text-xs text-foreground w-1/3 truncate">
                          {p.path}
                        </td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-muted/40 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
                              {p.count}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-card border border-border p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-serif text-foreground leading-none">{value}</div>
        <div className="text-xs text-muted-foreground mt-1.5">{label}</div>
      </div>
    </div>
  );
}
