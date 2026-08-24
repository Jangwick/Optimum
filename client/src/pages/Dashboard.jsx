import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.jsx';
import { NewClaimModal } from '../components/NewClaimModal.jsx';
import {
  DashboardMetricCard,
  DashboardSection,
  OpenTasksList,
} from '../components/DashboardWidgets.jsx';
import {
  VolumeChart,
  StatusBarChart,
  AgingBarChart,
} from '../components/DashboardCharts.jsx';
import { RecentClaims, RecentActivity } from '../components/DashboardLists.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import {
  Plus,
  ClipboardList,
  Home,
  CircleDollarSign,
  CheckCircle,
  BarChart3,
  Clock,
} from 'lucide-react';

const METRICS = [
  {
    key: 'active',
    title: 'Total Active Claims',
    subtitle: 'In progress',
    icon: ClipboardList,
    iconTint: 'bg-primary/10 text-primary',
    cap: 'border-t-4 border-t-primary',
  },
  {
    key: 'pendingInspections',
    title: 'Pending Inspections',
    subtitle: 'Scheduled',
    icon: Home,
    iconTint: 'bg-accent-orange/10 text-accent-orange',
    cap: 'border-t-4 border-t-accent-orange',
  },
  {
    key: 'estimated',
    title: 'Estimated Loss',
    subtitle: 'Aggregate exposure',
    icon: CircleDollarSign,
    iconTint: 'bg-primary/10 text-primary',
    cap: 'border-t-4 border-t-primary',
  },
  {
    key: 'settledMTD',
    title: 'Settled MTD',
    subtitle: 'Settled this month',
    icon: CheckCircle,
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

  const metricValues = {
    active: data?.counts?.active ?? 0,
    pendingInspections: data?.counts?.pendingInspections ?? 0,
    estimated: data?.counts?.estimated ? formatCurrency(data.counts.estimated) : '₱0.00',
    settledMTD: data?.counts?.settledMTD ? formatCurrency(data.counts.settledMTD) : '₱0.00',
  };

  return (
    <>
      <AppLayout>
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-headline-lg font-semibold text-primary">Overview</h2>
            <p className="text-body-md text-on-surface-variant mt-1.5">
              {displayName
                ? `Welcome back, ${displayName}. Here is today's overview.`
                : 'Real-time metrics for the current adjustment cycle.'}
            </p>
          </div>
          {user?.role === 'ADMIN' && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowNewClaim(true)}
                className="bg-primary text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg text-body-md font-medium hover:bg-primary-container transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <Plus size={18} />
                New Claim
              </button>
            </div>
          )}
        </div>

        {loading || !data ? (
          <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-surface border border-surface-border rounded-lg p-5 h-32 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-surface border border-surface-border rounded-lg p-5 h-96 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {METRICS.map((m) => (
                <DashboardMetricCard
                  key={m.key}
                  title={m.title}
                  subtitle={m.subtitle}
                  value={metricValues[m.key]}
                  icon={m.icon}
                  iconTint={m.iconTint}
                  cap={m.cap}
                />
              ))}
            </div>

            {/* Volume Chart + Open Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardSection title="Claim Volume Over Time" icon={BarChart3}>
                  <VolumeChart monthlyData={data.monthlyVolume} weeklyData={data.weeklyVolume} />
                </DashboardSection>
              </div>
              <div className="lg:col-span-1">
                <DashboardSection
                  title={user?.role === 'ADMIN' ? 'Open Tasks' : 'My Open Tasks'}
                  icon={ClipboardList}
                >
                  <OpenTasksList
                    tasks={data.openTasksList || []}
                    overdueCount={data.counts?.overdueTasks || 0}
                    userRole={user?.role}
                  />
                </DashboardSection>
              </div>
            </div>

            {/* Status + Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardSection
                title="Claims by Process Status"
                icon={BarChart3}
                action={
                  <button
                    onClick={() => navigate('/claims')}
                    className="text-body-sm text-primary hover:text-primary-container font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                  >
                    View all
                    <span aria-hidden="true">→</span>
                  </button>
                }
              >
                <StatusBarChart data={data.statusBreakdown || []} />
              </DashboardSection>

              <DashboardSection title="Claim Aging" icon={Clock}>
                <AgingBarChart data={data.agingBuckets || []} />
              </DashboardSection>
            </div>

            {/* Recent Claims + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentClaims claims={data.recentClaims} />
              </div>
              <div className="lg:col-span-1">
                <RecentActivity activity={data.recentActivity} />
              </div>
            </div>
          </div>
        )}
      </AppLayout>
      <NewClaimModal
        open={showNewClaim}
        onClose={() => setShowNewClaim(false)}
        onCreated={(claim) => {
          setShowNewClaim(false);
          navigate(`/claims/${claim.id}`);
        }}
      />
    </>
  );
}
