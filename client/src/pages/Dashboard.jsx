import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import { Lock, Ban, AlertTriangle } from 'lucide-react';

const MetricCard = ({ title, value, color, cap }) => (
  <div className={`bg-surface border border-surface-border rounded shadow-sm p-6 border-t-4 ${cap}`}>
    <p className="text-label-md text-outline uppercase mb-1">{title}</p>
    <p className={`text-headline-lg font-semibold ${color || 'text-primary'}`}>{value}</p>
  </div>
);

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h2 className="text-headline-lg font-semibold text-primary">Dashboard</h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Welcome back, {user?.fullName}. Here is today&apos;s overview.
            </p>
          </div>

          {loading || !data ? (
            <p className="text-body-md text-on-surface-variant">Loading dashboard...</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Claims" value={data.counts?.total} color="text-primary" cap="border-t-primary" />
                <MetricCard title="Estimated Loss" value={formatCurrency(data.counts?.estimated)} color="text-primary" cap="border-t-primary" />
                <MetricCard title="Reserve" value={formatCurrency(data.counts?.reserve)} color="text-primary" cap="border-t-primary" />
                <MetricCard title="Open Tasks" value={data.counts?.openTasks} color="text-accent" cap="border-t-accent-orange" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Overdue Tasks" value={data.counts?.overdueTasks} color="text-error" cap="border-t-error" />
                <MetricCard title="Historical (Read-Only)" value={data.counts?.readOnly} color="text-on-surface-variant" cap="border-t-outline" />
                <MetricCard title="Cancelled" value={data.counts?.cancelled} color="text-error" cap="border-t-error" />
                <MetricCard title="Active (Editable)" value={(data.counts?.total || 0) - (data.counts?.readOnly || 0)} color="text-primary" cap="border-t-primary" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                  <h3 className="text-headline-sm font-semibold text-primary mb-4">Recent Claims</h3>
                  <div className="space-y-3">
                    {data.recentClaims?.length ? (
                      data.recentClaims.map((c) => (
                        <div
                          key={c.id}
                          className="flex justify-between items-center p-3 bg-surface-container-low rounded cursor-pointer hover:bg-surface-container"
                          onClick={() => navigate(`/claims/${c.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-body-md font-medium text-primary">{c.claimNumber}</p>
                              <p className="text-body-sm text-on-surface-variant">{c.client}</p>
                            </div>
                            {c.isReadOnly && (
                              c.isCancelled ? <Ban size={14} className="text-red-600" /> : <Lock size={14} className="text-gray-500" />
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {c.processStatus && (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-label-md font-medium"
                                style={{ backgroundColor: `${c.processStatus.color}20`, color: c.processStatus.color }}
                              >
                                {c.processStatus.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-body-md text-on-surface-variant">No recent claims.</p>
                    )}
                  </div>
                </section>

                <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                  <h3 className="text-headline-sm font-semibold text-primary mb-4">18-Stage Workflow Breakdown</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {data.statusBreakdown?.length ? (
                      data.statusBreakdown.map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-surface-container-low rounded">
                          <span className="text-body-sm">{s.status?.name}</span>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-label-md font-medium"
                            style={{ backgroundColor: `${s.status?.color}20`, color: s.status?.color }}
                          >
                            {s.count}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-body-md text-on-surface-variant">No status data.</p>
                    )}
                  </div>
                </section>

                <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                  <h3 className="text-headline-sm font-semibold text-primary mb-4">My Open Tasks</h3>
                  <div className="space-y-3">
                    {data.openTasksList?.length ? (
                      data.openTasksList.map((t) => {
                        const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
                        return (
                          <div key={t.id} className="p-3 bg-surface-container-low rounded">
                            <div className="flex justify-between items-start">
                              <p className="text-body-md font-medium text-primary">{t.title}</p>
                              <span
                                className={`text-label-md px-2 py-0.5 rounded flex items-center gap-1 ${
                                  isOverdue ? 'bg-error text-white' : 'bg-surface-container-high text-on-surface-variant'
                                }`}
                              >
                                {isOverdue && <AlertTriangle size={12} />}
                                {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                              </span>
                            </div>
                            <p className="text-body-sm text-on-surface-variant">{t.claim?.claimNumber || 'General'}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-body-md text-on-surface-variant">No open tasks.</p>
                    )}
                  </div>
                </section>
              </div>

              <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                <h3 className="text-headline-sm font-semibold text-primary mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {data.recentActivity?.length ? (
                    data.recentActivity.map((a) => (
                      <div key={a.id} className="flex justify-between items-center p-3 bg-surface-container-low rounded">
                        <div>
                          <p className="text-body-md font-medium text-primary">{a.action}</p>
                          <p className="text-body-sm text-on-surface-variant">
                            {a.user ? `${a.user.firstName} ${a.user.lastName}` : 'System'} on {a.tableName}
                          </p>
                        </div>
                        <span className="text-body-sm text-outline">{new Date(a.createdAt).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-body-md text-on-surface-variant">No recent activity.</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
