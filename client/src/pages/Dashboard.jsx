import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { NewClaimModal } from '../components/NewClaimModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import {
  Plus,
  ClipboardList,
  Activity,
  FileText,
  CircleDollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

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
  if (action?.includes('STATUS')) return { icon: Activity, tint: 'bg-success-green/10 text-success-green' };
  if (action?.includes('DOCUMENT') || action?.includes('DISCUSSION'))
    return { icon: FileText, tint: 'bg-accent-orange/10 text-accent-orange' };
  return { icon: Activity, tint: 'bg-surface-container-high text-on-surface-variant' };
}

const METRICS = [
  {
    key: 'total',
    title: 'Total Claims',
    subtitle: 'All time',
    icon: ClipboardList,
    iconTint: 'bg-primary/10 text-primary',
    cap: 'border-t-4 border-t-primary',
  },
  {
    key: 'estimated',
    title: 'Estimated Loss',
    subtitle: 'Aggregate exposure',
    icon: CircleDollarSign,
    iconTint: 'bg-primary/10 text-primary',
    cap: 'border-t-4 border-t-primary',
    format: true,
  },
  {
    key: 'active',
    title: 'Active Claims',
    subtitle: 'In progress',
    icon: TrendingUp,
    iconTint: 'bg-success-green/10 text-success-green',
    cap: 'border-t-4 border-t-success-green',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const activeCount = (data?.counts?.total || 0) - (data?.counts?.readOnly || 0);

  const metricValues = {
    total: data?.counts?.total ?? 0,
    estimated: data?.counts?.estimated ? formatCurrency(data.counts.estimated) : '₱0.00',
    active: activeCount,
  };

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
              <p className="text-body-md text-on-surface-variant mt-1.5">
                {displayName
                  ? `Welcome back, ${displayName}. Here is today's overview.`
                  : 'Real-time metrics for the current adjustment cycle.'}
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowNewClaim(true)}
                className="bg-primary text-white px-5 py-2.5 rounded-lg text-body-md font-medium hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2"
              >
                <Plus size={18} />
                New Claim
              </button>
            )}
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
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {METRICS.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.key}
                      className={`bg-surface ${m.cap} border-x border-b border-surface-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-body-sm font-semibold uppercase text-outline tracking-wide">
                            {m.title}
                          </span>
                          <p className="text-label-md text-outline/70 mt-0.5">{m.subtitle}</p>
                        </div>
                        <div className={`p-2.5 ${m.iconTint} rounded-lg flex items-center justify-center`}>
                          <Icon size={22} />
                        </div>
                      </div>
                      <h3 className="text-display-lg font-bold text-on-surface tabular-nums">
                        {metricValues[m.key]}
                      </h3>
                    </div>
                  );
                })}
              </div>

              {/* Recent Claims + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Claims - spans 2 columns */}
                <section className="lg:col-span-2 bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface-container-lowest">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <FileText size={18} />
                      </div>
                      <h3 className="text-headline-sm font-semibold text-primary">Recent Claims</h3>
                    </div>
                    <button
                      onClick={() => navigate('/claims')}
                      className="text-body-sm text-primary hover:text-primary-container font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      View all
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {data.recentClaims?.length ? (
                      <div className="flex flex-col">
                        {data.recentClaims.map((c) => (
                          <div
                            key={c.id}
                            className="p-4 hover:bg-surface-container-low transition-colors rounded-lg flex gap-4 items-center cursor-pointer border-b border-surface-border/50 last:border-b-0"
                            onClick={() => navigate(`/claims/${c.id}`)}
                          >
                            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-body-md font-medium text-on-surface font-mono truncate">
                                {c.claimNumber}
                              </p>
                              <p className="text-body-sm text-on-surface-variant truncate mt-0.5">
                                {c.client || '— Unresolved —'}
                              </p>
                            </div>
                            {c.processStatus && (
                              <span
                                className="px-3 py-1 rounded-full text-body-sm font-medium shrink-0"
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
                      <div className="p-10 text-center">
                        <ClipboardList size={36} className="mx-auto text-outline mb-3" />
                        <p className="text-body-md text-on-surface-variant">No recent claims.</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Recent Activity */}
                <section className="bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-surface-border bg-surface-container-lowest">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Activity size={18} />
                      </div>
                      <h3 className="text-headline-sm font-semibold text-primary">Recent Activity</h3>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 max-h-[500px]">
                    {data.recentActivity?.length ? (
                      <div className="flex flex-col">
                        {data.recentActivity.slice(0, 12).map((a, idx) => {
                          const { icon: Icon, tint } = activityIcon(a.action);
                          const actor = a.user
                            ? `${a.user.firstName} ${a.user.lastName}`.trim()
                            : 'System';
                          return (
                            <div
                              key={a.id}
                              className={`p-3 hover:bg-surface-container-low transition-colors rounded-lg flex gap-3 ${
                                idx !== 11 && idx !== data.recentActivity.length - 1
                                  ? 'border-b border-surface-border/50'
                                  : ''
                              }`}
                            >
                              <div className="shrink-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tint}`}>
                                  <Icon size={16} />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-body-sm text-on-surface leading-snug">
                                  <span className="font-semibold">{actor}</span>{' '}
                                  <span className="text-on-surface-variant">
                                    {a.action?.toLowerCase()?.replace(/_/g, ' ')}
                                  </span>
                                </p>
                                <p className="text-label-sm text-outline mt-0.5 font-mono">
                                  {timeAgo(a.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-10 text-center">
                        <Activity size={36} className="mx-auto text-outline mb-3" />
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
      <NewClaimModal
        open={showNewClaim}
        onClose={() => setShowNewClaim(false)}
        onCreated={(claim) => {
          setShowNewClaim(false);
          navigate(`/claims/${claim.id}`);
        }}
      />
    </div>
  );
}
