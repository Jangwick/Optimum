import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function MetricCard({ title, value, trend, trendType, iconColor, icon }) {
  const trendColor =
    trendType === 'positive'
      ? 'text-success-green'
      : trendType === 'negative'
        ? 'text-error'
        : 'text-primary';
  return (
    <div className="bg-surface border-t-4 rounded-b p-6 shadow-sm" style={{ borderTopColor: iconColor }}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-label-md uppercase text-outline">{title}</span>
        <div className="p-2 rounded" style={{ backgroundColor: `${iconColor}1A`, color: iconColor }}>
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-4">
        <h3 className="text-display-lg font-semibold text-on-surface">{value}</h3>
        {trend && <div className={`text-body-sm mb-2 ${trendColor}`}>{trend}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onLogout={logout} />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">Overview</h2>
              <p className="text-body-md text-on-surface-variant mt-1">Real-time metrics for current adjustment cycle.</p>
            </div>
            <button className="bg-primary text-white px-4 py-2 rounded text-label-md uppercase hover:bg-primary-container transition-colors shadow-sm">
              + New Claim
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <MetricCard
              title="Total Active Claims"
              value="1,248"
              trend="+5.2%"
              trendType="positive"
              iconColor="#102175"
              icon={<span className="text-xl">📄</span>}
            />
            <MetricCard
              title="Pending Inspections"
              value="342"
              trend="+12.4%"
              trendType="negative"
              iconColor="#f26522"
              icon={<span className="text-xl">🔧</span>}
            />
            <MetricCard
              title="Settled MTD"
              value="$4.2M"
              trend="+2.1%"
              trendType="positive"
              iconColor="#28a745"
              icon={<span className="text-xl">✓</span>}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface border border-surface-border rounded shadow-sm h-96 p-6">
              <h3 className="text-headline-sm font-semibold text-primary mb-4">Claim Volume Over Time</h3>
              <div className="h-64 bg-surface-container-lowest rounded flex items-end justify-around px-8 pb-8 pt-4 gap-2">
                {[40, 60, 35, 80, 50, 90, 75].map((h, i) => (
                  <div
                    key={i}
                    className="w-full rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${h}%`, backgroundColor: i === 5 ? '#f26522' : '#2b3a8c' }}
                  />
                ))}
              </div>
            </div>

            <div className="bg-surface border border-surface-border rounded shadow-sm h-96 flex flex-col">
              <div className="p-6 border-b border-surface-border bg-surface-container-lowest">
                <h3 className="text-headline-sm font-semibold text-primary">Recent Activity</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <p className="text-body-sm text-on-surface-variant p-4">
                  Logged in as <strong>{user?.fullName}</strong> ({user?.role}).
                </p>
                <p className="text-body-sm text-on-surface-variant p-4">Activity feed will appear here.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
