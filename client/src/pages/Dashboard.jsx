import { useEffect, useState } from 'react';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';

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

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const capClass = (title) => {
    if (title === 'Open Tasks') return 'border-t-accent-orange';
    if (title === 'Reserve') return 'border-t-primary';
    return 'border-t-primary';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h2 className="text-headline-lg font-semibold text-primary">Dashboard</h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Welcome back, {user?.fullName}. Here is today’s overview.
            </p>
          </div>

          {loading || !data ? (
            <p className="text-body-md text-on-surface-variant">Loading dashboard...</p>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total Claims" value={data.counts?.total} color="text-primary" cap="border-t-primary" />
                <MetricCard title="Estimated Loss" value={formatCurrency(data.counts?.estimated)} color="text-primary" cap={capClass('Estimated Loss')} />
                <MetricCard title="Reserve" value={formatCurrency(data.counts?.reserve)} color="text-primary" cap={capClass('Reserve')} />
                <MetricCard title="Open Tasks" value={data.counts?.openTasks} color="text-accent" cap={capClass('Open Tasks')} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                  <h3 className="text-headline-sm font-semibold text-primary mb-4">Recent Claims</h3>
                  <div className="space-y-3">
                    {data.recentClaims?.length ? (
                      data.recentClaims.map((c) => (
                        <div key={c.id} className="flex justify-between items-center p-3 bg-surface-container-low rounded">
                          <div>
                            <p className="text-body-md font-medium text-primary">{c.claimNumber}</p>
                            <p className="text-body-sm text-on-surface-variant">{c.client}</p>
                          </div>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-label-md font-medium"
                            style={{ backgroundColor: `${c.status?.color}20`, color: c.status?.color }}
                          >
                            {c.status?.code}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-body-md text-on-surface-variant">No recent claims.</p>
                    )}
                  </div>
                </section>

                <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                  <h3 className="text-headline-sm font-semibold text-primary mb-4">Status Breakdown</h3>
                  <div className="space-y-3">
                    {data.statusBreakdown?.length ? (
                      data.statusBreakdown.map((s, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-surface-container-low rounded">
                          <span className="text-body-md">{s.status?.name}</span>
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
                      data.openTasksList.map((t) => (
                        <div key={t.id} className="p-3 bg-surface-container-low rounded">
                          <div className="flex justify-between items-start">
                            <p className="text-body-md font-medium text-primary">{t.title}</p>
                            <span
                              className={`text-label-md px-2 py-0.5 rounded ${
                                t.dueDate && new Date(t.dueDate) < new Date() ? 'bg-error text-white' : 'bg-surface-container-high text-on-surface-variant'
                              }`}
                            >
                              {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                            </span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant">{t.claim?.claimNumber || 'General'}</p>
                        </div>
                      ))
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
