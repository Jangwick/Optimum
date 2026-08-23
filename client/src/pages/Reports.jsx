import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Clock,
  Download,
  Activity,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout.jsx';
import { getAnalytics } from '../services/analytics.service.js';
import { formatCurrency } from '../utils/currency.js';

const PIE_COLORS = ['#1a3a5c', '#2d5a87', '#4a90d9', '#f5a623', '#e74c3c', '#27ae60', '#8e44ad', '#3498db', '#e67e22', '#1abc9c'];

function MetricCard({ icon: Icon, label, value, subtitle, tint }) {
  return (
    <div className="bg-surface border border-surface-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${tint}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="text-body-sm text-on-surface-variant font-medium">{label}</p>
      <p className="text-headline-md font-bold text-on-surface tabular-nums mt-1">{value}</p>
      {subtitle && <p className="text-body-sm text-outline mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children, action }) {
  return (
    <section className="bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 border-b border-surface-border bg-surface-container-lowest flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-headline-sm font-semibold text-primary">{title}</h3>
            {subtitle && <p className="text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e2e5',
  borderRadius: '8px',
  fontSize: '13px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <AppLayout>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-surface border border-surface-border rounded-lg p-5 h-32 animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-surface border border-surface-border rounded-lg p-5 h-80 animate-pulse" />
                ))}
              </div>
            </div>
      </AppLayout>
    );
  }

  const s = data.summary;

  return (
    <AppLayout>
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">Reports & Analytics</h2>
              <p className="text-body-md text-on-surface-variant mt-1.5">
                Claims performance, financial summaries, and operational insights.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-primary text-white px-5 py-2.5 rounded-lg text-body-md font-medium hover:bg-primary-container transition-colors shadow-sm flex items-center gap-2"
            >
              <Download size={18} />
              Export
            </button>
          </div>

          <div className="space-y-6">
            {/* Summary Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={FileText}
                label="Total Claims"
                value={s.totalClaims}
                subtitle="All time"
                tint="bg-primary/10 text-primary"
              />
              <MetricCard
                icon={DollarSign}
                label="Estimated Loss"
                value={formatCurrency(s.estimatedLoss)}
                subtitle="Aggregate"
                tint="bg-error/10 text-error"
              />
              <MetricCard
                icon={TrendingUp}
                label="Agreed Settlement"
                value={formatCurrency(s.agreedSettlement)}
                subtitle={`${s.settlementCount} settled`}
                tint="bg-success-green/10 text-success-green"
              />
              <MetricCard
                icon={DollarSign}
                label="Total Invoiced"
                value={formatCurrency(s.totalInvoiced)}
                subtitle={`${s.invoiceCount} invoices`}
                tint="bg-accent-orange/10 text-accent-orange"
              />
            </div>

            {/* Secondary Financial Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                icon={DollarSign}
                label="Claimed Amount"
                value={formatCurrency(s.claimedAmount)}
                tint="bg-surface-container-high text-on-surface-variant"
              />
              <MetricCard
                icon={DollarSign}
                label="Actual Loss"
                value={formatCurrency(s.actualLoss)}
                tint="bg-surface-container-high text-on-surface-variant"
              />
              <MetricCard
                icon={DollarSign}
                label="Adjusted Loss"
                value={formatCurrency(s.adjustedLoss)}
                tint="bg-surface-container-high text-on-surface-variant"
              />
              <MetricCard
                icon={DollarSign}
                label="Total Paid"
                value={formatCurrency(s.totalPaid)}
                subtitle={`${s.paymentCount} payments`}
                tint="bg-success-green/10 text-success-green"
              />
            </div>

            {/* Monthly Trend Chart */}
            <ChartCard
              title="Monthly Claim Trend"
              subtitle="Claims received and estimated loss over the last 12 months"
              icon={Activity}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e5" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#7a7a7a' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#7a7a7a' }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#7a7a7a' }}
                    tickFormatter={(v) => `₱${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="claims"
                    stroke="#1a3a5c"
                    strokeWidth={2}
                    name="Claims"
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="estimatedLoss"
                    stroke="#f5a623"
                    strokeWidth={2}
                    name="Estimated Loss"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Status Breakdown + Claim Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Claims by Process Status"
                subtitle="Distribution across the 18-stage workflow"
                icon={BarChart3}
                action={
                  <button
                    onClick={() => navigate('/claims')}
                    className="text-body-sm text-primary hover:text-primary-container font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    View Claims
                  </button>
                }
              >
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={data.statusBreakdown} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e5" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#7a7a7a' }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#5a5a5a' }}
                      width={130}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Claims" radius={[0, 4, 4, 0]}>
                      {data.statusBreakdown.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color || PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard
                title="Claims by Type"
                subtitle="Distribution across claim categories"
                icon={FileText}
              >
                {data.typeBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={data.typeBreakdown}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        label={({ name, percent }) =>
                          `${name.length > 15 ? name.slice(0, 12) + '…' : name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={{ fontSize: 11 }}
                      >
                        {data.typeBreakdown.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 sm:h-80 flex items-center justify-center text-on-surface-variant text-body-md">
                    No claim type data available.
                  </div>
                )}
              </ChartCard>
            </div>

            {/* Engineer Workload + Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Engineer Workload"
                subtitle="Active claims assigned per engineer"
                icon={Users}
              >
                {data.engineerWorkload.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.engineerWorkload}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e5" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7a7a7a' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#7a7a7a' }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="count" name="Claims" fill="#1a3a5c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-56 sm:h-72 flex items-center justify-center text-on-surface-variant text-body-md">
                    No engineer assignments.
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Claim Aging"
                subtitle="Open claims by age since received"
                icon={Clock}
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.agingBuckets}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e5" />
                    <XAxis dataKey="label" tick={{ fontSize: 13, fill: '#7a7a7a' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#7a7a7a' }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Claims" radius={[4, 4, 0, 0]}>
                      {data.agingBuckets.map((entry, idx) => {
                        const colors = ['#27ae60', '#f5a623', '#e67e22', '#e74c3c'];
                        return <Cell key={idx} fill={colors[idx % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Top Clients Table */}
            <ChartCard
              title="Top Clients by Claim Volume"
              subtitle="Clients with the most assigned claims"
              icon={Users}
            >
              {data.topClients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container-high text-on-surface-variant text-body-sm uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">Rank</th>
                        <th className="px-4 py-3 font-medium">Client</th>
                        <th className="px-4 py-3 font-medium text-right">Claims</th>
                        <th className="px-4 py-3 font-medium">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-body-md">
                      {data.topClients.map((c, idx) => {
                        const pct = ((c.count / s.totalClaims) * 100).toFixed(1);
                        return (
                          <tr
                            key={idx}
                            onClick={() => navigate(`/claims?search=${encodeURIComponent(c.name)}`)}
                            className="hover:bg-surface-container-low transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-3 text-on-surface-variant font-mono">#{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-on-surface">{c.name}</td>
                            <td className="px-4 py-3 text-right tabular-nums text-on-surface">{c.count}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden max-w-[120px]">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                                <span className="text-body-sm text-on-surface-variant tabular-nums">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-32 sm:h-40 flex items-center justify-center text-on-surface-variant text-body-md">
                  No client data available.
                </div>
              )}
            </ChartCard>
          </div>
    </AppLayout>
  );
}
