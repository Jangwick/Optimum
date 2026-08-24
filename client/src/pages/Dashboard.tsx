import { useEffect, useState, type ReactNode, type ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
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

interface Metric {
  key: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconTint: string;
  cap: string;
}

const METRICS: Metric[] = [
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
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data as Record<string, unknown>))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  const counts = data ? (data['counts'] as Record<string, unknown> | undefined) : undefined;
  const metricValues: Record<string, ReactNode> = {
    active: (counts?.['active'] as number | undefined) ?? 0,
    pendingInspections: (counts?.['pendingInspections'] as number | undefined) ?? 0,
    estimated: counts?.['estimated']
      ? formatCurrency(counts['estimated'] as string | number)
      : '₱0.00',
    settledMTD: counts?.['settledMTD']
      ? formatCurrency(counts['settledMTD'] as string | number)
      : '₱0.00',
  };

  const monthlyVolume = (data?.['monthlyVolume'] as Record<string, unknown>[] | undefined) ?? [];
  const weeklyVolume = (data?.['weeklyVolume'] as Record<string, unknown>[] | undefined) ?? [];
  const statusBreakdown = (data?.['statusBreakdown'] as Record<string, unknown>[] | undefined) ?? [];
  const agingBuckets = (data?.['agingBuckets'] as Record<string, unknown>[] | undefined) ?? [];
  const openTasksList = (data?.['openTasksList'] as Record<string, unknown>[] | undefined) ?? [];
  const recentClaims = (data?.['recentClaims'] as Record<string, unknown>[] | undefined) ?? [];
  const recentActivity = (data?.['recentActivity'] as Record<string, unknown>[] | undefined) ?? [];
  const overdueTasks = (counts?.['overdueTasks'] as number | undefined) ?? 0;

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
                  value={metricValues[m.key] as ReactNode}
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
                  <VolumeChart
                    monthlyData={monthlyVolume as unknown as ComponentProps<typeof VolumeChart>['monthlyData']}
                    weeklyData={weeklyVolume as unknown as ComponentProps<typeof VolumeChart>['weeklyData']}
                  />
                </DashboardSection>
              </div>
              <div className="lg:col-span-1">
                <DashboardSection
                  title={user?.role === 'ADMIN' ? 'Open Tasks' : 'My Open Tasks'}
                  icon={ClipboardList}
                >
                  <OpenTasksList
                    tasks={openTasksList as unknown as ComponentProps<typeof OpenTasksList>['tasks']}
                    overdueCount={overdueTasks}
                    userRole={user?.role ?? ''}
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
                <StatusBarChart
                  data={statusBreakdown as unknown as ComponentProps<typeof StatusBarChart>['data']}
                />
              </DashboardSection>

              <DashboardSection title="Claim Aging" icon={Clock}>
                <AgingBarChart
                  data={agingBuckets as unknown as ComponentProps<typeof AgingBarChart>['data']}
                />
              </DashboardSection>
            </div>

            {/* Recent Claims + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentClaims
                  claims={recentClaims as unknown as ComponentProps<typeof RecentClaims>['claims']}
                />
              </div>
              <div className="lg:col-span-1">
                <RecentActivity
                  activity={recentActivity as unknown as ComponentProps<typeof RecentActivity>['activity']}
                />
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
          if (claim) {
            navigate(`/claims/${claim['id'] as string | number}`);
          }
        }}
      />
    </>
  );
}
