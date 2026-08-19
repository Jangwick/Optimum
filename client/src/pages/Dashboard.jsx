import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import {
  Lock,
  Ban,
  AlertTriangle,
  Plus,
  ClipboardList,
  Clock,
  CheckCircle2,
  Activity,
  FileText,
  Archive,
  XCircle,
  CircleDollarSign,
} from 'lucide-react';

const PRIMARY_METRICS = [
  {
    key: 'total',
    title: 'Total Claims',
    icon: ClipboardList,
    iconTint: 'bg-primary/10 text-primary',
    cap: 'border-t-primary',
  },
  {
    key: 'estimated',
    title: 'Estimated Loss',
    icon: CircleDollarSign,
    iconTint: 'bg-primary/10 text-primary',
    cap: 'border-t-primary',
    format: true,
  },
  {
    key: 'openTasks',
    title: 'Open Tasks',
    icon: Clock,
    iconTint: 'bg-accent-orange/10 text-accent-orange',
    cap: 'border-t-accent-orange',
  },
];

const SECONDARY_METRICS = [
  { key: 'overdueTasks', title: 'Overdue', icon: AlertTriangle, color: 'text-error', tint: 'bg-error/10' },
  { key: 'readOnly', title: 'Historical', icon: Archive, color: 'text-on-surface-variant', tint: 'bg-surface-container-high' },
  { key: 'cancelled', title: 'Cancelled', icon: XCircle, color: 'text-error', tint: 'bg-error/10' },
  { key: 'active', title: 'Active', icon: CheckCircle2, color: 'text-success-green', tint: 'bg-success-green/10' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function activityIcon(action) {
  if (action?.includes('CLAIM_CREATED')) return { icon: Plus, tint: 'bg-primary/10 text-primary' };
  if (action?.includes('REPORT')) return { icon: FileText, tint: 'bg-primary/10 text-primary' };
  if (action?.includes('IMPORT')) return { icon: Archive, tint: 'bg-accent-orange/10 text-accent-orange' };
  if (action?.includes('STATUS')) return { icon: Activity, tint: 'bg-success-green/10 text-success-green' };
  return { icon: Activity, tint: 'bg-surface-container-high text-on-surface-variant' };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const activeCount = (data?.counts?.total || 0) - (data?.counts?.readOnly || 0);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">Overview</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                {displayName
                  ? `Welcome back, ${displayName}. Here is today's overview.`
                  : 'Real-time metrics for the current adjustment cycle.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/claims/new')}
              className="bg-primary text-white px-4 py-2 rounded text-label-md font-medium uppercase hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={18} />
              New Claim
            </button>
          </div>

          {loading || !data ? (
            <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-surface border border-surface-border rounded-lg p-6 h-32 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-surface border border-surface-border rounded-lg p-6 h-96 animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Primary Metric Cards (Bento) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PRIMARY_METRICS.map((m) => {
                  const Icon = m.icon;
                  const value = m.format ? formatCurrency(data.counts?.[m.key]) : data.counts?.[m.key];
                  return (
                    <div
                      key={m.key}
                      className={`bg-surface border-t-4 ${m.cap} border-x border-b border-surface-border rounded-b-lg p-6 shadow-sm`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-label-md font-medium uppercase text-outline">{m.title}</span>
                        <div className={`p-2 ${m.iconTint} rounded flex items-center justify-center`}>
                          <Icon size={20} />
                        </div>
                      </div>
                      <div className="flex items-end gap-4">
                        <h3 className="text-display-lg font-bold text-on-surface tabular-nums">{value}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Secondary Metrics (compact chips) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SECONDARY_METRICS.map((m) => {
                  const Icon = m.icon;
                  const value = m.key === 'active' ? activeCount : data.counts?.[m.key];
                  return (
                    <div
                      key={m.key}
                      className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3"
                    >
                      <div className={`p-2 rounded ${m.tint} flex items-center justify-center shrink-0`}>
                        <Icon size={18} className={m.color} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-label-md text-outline uppercase truncate">{m.title}</p>
                        <p className={`text-headline-sm font-semibold tabular-nums ${m.color}`}>{value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Main Grid: Recent Claims (2 cols) + Workflow Breakdown (1 col) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Claims - spans 2 columns */}
                <section className="lg:col-span-2 bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col">
                  <div className="p-6 border-b border-surface-border flex justify-between items-center bg-surface-container-lowest rounded-t-lg">
                    <h3 className="text-headline-sm font-semibold text-primary">Recent Claims</h3>
                    <button
                      onClick={() => navigate('/claims')}
                      className="text-label-md text-primary hover:underline font-medium"
                    >
                      View all
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {data.recentClaims?.length ? (
                      <div className="flex flex-col">
                        {data.recentClaims.map((c, idx) => (
                          <div
                            key={c.id}
                            className={`p-4 hover:bg-surface-container-low transition-colors rounded flex gap-4 items-center cursor-pointer ${
                              idx !== data.recentClaims.length - 1 ? 'border-b border-surface-border/50' : ''
                            }`}
                            onClick={() => navigate(`/claims/${c.id}`)}
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-body-md font-medium text-on-surface font-mono truncate">
                                  {c.claimNumber}
                                </p>
                                {c.isReadOnly && (
                                  c.isCancelled ? (
                                    <Ban size={14} className="text-error shrink-0" />
                                  ) : (
                                    <Lock size={14} className="text-outline shrink-0" />
                                  )
                                )}
                              </div>
                              <p className="text-body-sm text-on-surface-variant truncate">
                                {c.client || '— Unresolved —'}
                              </p>
                            </div>
                            {c.processStatus && (
                              <span
                                className="px-2.5 py-1 rounded-full text-label-md font-medium shrink-0"
                                style={{
                                  backgroundColor: `${c.processStatus.color}1a`,
                                  color: c.processStatus.color,
                                }}
                              >
                                {c.processStatus.name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <ClipboardList size={32} className="mx-auto text-outline mb-2" />
                        <p className="text-body-md text-on-surface-variant">No recent claims.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* 18-Stage Workflow Breakdown */}
                <section className="bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col">
                  <div className="p-6 border-b border-surface-border bg-surface-container-lowest rounded-t-lg">
                    <h3 className="text-headline-sm font-semibold text-primary">Workflow Breakdown</h3>
                    <p className="text-label-md text-outline uppercase mt-1">18-Stage Process</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 max-h-[400px]">
                    {data.statusBreakdown?.length ? (
                      <div className="space-y-1.5">
                        {data.statusBreakdown.map((s, idx) => {
                          const total = data.counts?.total || 1;
                          const pct = Math.round((s.count / total) * 100);
                          return (
                            <div
                              key={idx}
                              className="p-3 bg-surface-container-low rounded hover:bg-surface-container transition-colors"
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-body-sm text-on-surface truncate">{s.status?.name}</span>
                                <span
                                  className="px-2.5 py-0.5 rounded-full text-label-md font-medium tabular-nums shrink-0 ml-2"
                                  style={{
                                    backgroundColor: `${s.status?.color}1a`,
                                    color: s.status?.color,
                                  }}
                                >
                                  {s.count}
                                </span>
                              </div>
                              <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor: s.status?.color,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Activity size={32} className="mx-auto text-outline mb-2" />
                        <p className="text-body-md text-on-surface-variant">No status data.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* My Open Tasks + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Open Tasks */}
                <section className="bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col">
                  <div className="p-6 border-b border-surface-border bg-surface-container-lowest rounded-t-lg flex justify-between items-center">
                    <h3 className="text-headline-sm font-semibold text-primary">My Open Tasks</h3>
                    {data.counts?.overdueTasks > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-label-md font-medium bg-error/10 text-error flex items-center gap-1">
                        <AlertTriangle size={12} />
                        {data.counts.overdueTasks} overdue
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-3">
                    {data.openTasksList?.length ? (
                      <div className="space-y-2">
                        {data.openTasksList.map((t) => {
                          const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
                          return (
                            <div
                              key={t.id}
                              className="p-3 bg-surface-container-low rounded hover:bg-surface-container transition-colors"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <p className="text-body-md font-medium text-on-surface">{t.title}</p>
                                <span
                                  className={`text-label-md px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                                    isOverdue ? 'bg-error text-white' : 'bg-surface-container-high text-on-surface-variant'
                                  }`}
                                >
                                  {isOverdue && <AlertTriangle size={12} />}
                                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                                </span>
                              </div>
                              {t.claim?.claimNumber && (
                                <p className="text-body-sm text-on-surface-variant mt-1 font-mono">
                                  {t.claim.claimNumber}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <CheckCircle2 size={32} className="mx-auto text-success-green mb-2" />
                        <p className="text-body-md text-on-surface-variant">All caught up. No open tasks.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Recent Activity Feed - spans 2 columns */}
                <section className="lg:col-span-2 bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col">
                  <div className="p-6 border-b border-surface-border bg-surface-container-lowest rounded-t-lg">
                    <h3 className="text-headline-sm font-semibold text-primary">Recent Activity</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 max-h-[400px]">
                    {data.recentActivity?.length ? (
                      <div className="flex flex-col">
                        {data.recentActivity.map((a, idx) => {
                          const { icon: Icon, tint } = activityIcon(a.action);
                          const actor = a.user
                            ? `${a.user.firstName} ${a.user.lastName}`.trim()
                            : 'System';
                          return (
                            <div
                              key={a.id}
                              className={`p-4 hover:bg-surface-container-low transition-colors rounded flex gap-4 ${
                                idx !== data.recentActivity.length - 1
                                  ? 'border-b border-surface-border/50'
                                  : ''
                              }`}
                            >
                              <div className="shrink-0">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${tint}`}
                                >
                                  <Icon size={16} />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-body-sm text-on-surface">
                                  <span className="font-semibold">{actor}</span>{' '}
                                  <span className="text-on-surface-variant">
                                    {a.action?.toLowerCase()?.replace(/_/g, ' ')}
                                  </span>{' '}
                                  <span className="text-primary font-medium">{a.tableName}</span>
                                </p>
                                <p className="text-label-sm text-outline mt-1">{timeAgo(a.createdAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Activity size={32} className="mx-auto text-outline mb-2" />
                        <p className="text-body-md text-on-surface-variant">No recent activity.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
