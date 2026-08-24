import { useNavigate } from 'react-router-dom';
import { ClipboardList, Activity, FileText, ArrowRight, Plus } from 'lucide-react';

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

export function RecentClaims({ claims }) {
  const navigate = useNavigate();

  return (
    <section className="bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col overflow-hidden">
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
        {claims?.length ? (
          <div className="flex flex-col">
            {claims.map((c) => (
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
  );
}

export function RecentActivity({ activity }) {
  return (
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
        {activity?.length ? (
          <div className="flex flex-col">
            {activity.slice(0, 12).map((a, idx) => {
              const { icon: Icon, tint } = activityIcon(a.action);
              const actor = a.user
                ? `${a.user.firstName} ${a.user.lastName}`.trim()
                : 'System';
              return (
                <div
                  key={a.id}
                  className={`p-3 hover:bg-surface-container-low transition-colors rounded-lg flex gap-3 ${
                    idx !== 11 && idx !== activity.length - 1
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
  );
}
