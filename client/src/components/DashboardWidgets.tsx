import { useNavigate } from 'react-router-dom';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface DashboardMetricCardProps {
  title: string;
  subtitle?: string;
  value: ReactNode;
  icon: LucideIcon;
  cap: string;
  iconTint: string;
}

export function DashboardMetricCard({ title, subtitle, value, icon: Icon, cap, iconTint }: DashboardMetricCardProps) {
  return (
    <div
      className={`bg-surface ${cap} border-x border-b border-surface-border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-body-sm font-semibold uppercase text-outline tracking-wide">
            {title}
          </span>
          {subtitle && <p className="text-label-md text-outline/70 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`p-2.5 ${iconTint} rounded-lg flex items-center justify-center`}>
          <Icon size={22} />
        </div>
      </div>
      <h3 className="text-[clamp(1.75rem,2.4vw,2.25rem)] font-bold text-on-surface break-words leading-tight tabular-nums">
        {value}
      </h3>
    </div>
  );
}

interface DashboardSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  action?: ReactNode;
}

export function DashboardSection({ title, icon: Icon, children, action }: DashboardSectionProps) {
  return (
    <section className="bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-surface-border bg-surface-container-lowest flex justify-between items-center gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Icon size={18} />
          </div>
          <h3 className="text-headline-sm font-semibold text-primary">{title}</h3>
        </div>
        {action}
      </div>
      <div className="flex-1 p-4 sm:p-5">{children}</div>
    </section>
  );
}

interface AssignedUser {
  firstName?: string;
  lastName?: string;
}

interface TaskClaim {
  id: number;
  claimNumber?: string;
}

interface Task {
  id: number;
  title: string;
  dueDate?: string | null;
  assignedTo?: AssignedUser | null;
  claim?: TaskClaim | null;
}

interface OpenTasksListProps {
  tasks: Task[];
  overdueCount: number;
  userRole: string;
}

export function OpenTasksList({ tasks, overdueCount, userRole }: OpenTasksListProps) {
  const now = new Date();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {overdueCount > 0 && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-error/10 text-error text-body-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-error" />
          {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}
        </div>
      )}
      <div className="flex-1 overflow-y-auto -mx-2 -my-2 px-2 py-2 max-h-[320px]">
        {tasks.length ? (
          <div className="flex flex-col gap-2">
            {tasks.map((t) => {
              const isOverdue = t.dueDate ? new Date(t.dueDate) < now : false;
              const actor = t.assignedTo
                ? `${t.assignedTo.firstName ?? ''} ${t.assignedTo.lastName ?? ''}`.trim()
                : 'Unassigned';
              return (
                <button
                  key={t.id}
                  onClick={() => t.claim && navigate(`/claims/${t.claim.id}`)}
                  className="text-left w-full p-3 rounded-lg hover:bg-surface-container-low transition-colors border border-surface-border/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-body-sm font-medium text-on-surface line-clamp-2">{t.title}</p>
                    {isOverdue && (
                      <span className="shrink-0 px-2 py-0.5 rounded-full text-label-sm font-medium bg-error/10 text-error">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-label-sm text-outline mt-1 font-mono">
                    {t.claim?.claimNumber || '—'} · {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                  </p>
                  {userRole === 'ADMIN' && (
                    <p className="text-label-sm text-on-surface-variant mt-0.5">{actor}</p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-body-md text-on-surface-variant">No open tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
