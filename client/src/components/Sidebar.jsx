import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  History,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Claims', href: '/claims' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
  { icon: Building2, label: 'Master Data', href: '/master-data' },
];

const adminNavItems = [
  { icon: Users, label: 'Employees', href: '/employees' },
  { icon: History, label: 'Audit Logs', href: '/audit-logs' },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] bg-sidebar-bg text-white flex flex-col py-4 z-30">
      <div className="px-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 ring-1 ring-white/15">
            <img src="/logo.png" alt="Optimum Logo" className="w-7 h-7 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-headline-sm font-bold text-white leading-tight">Optimum Claims</h1>
            <p className="text-label-md text-on-primary/60 uppercase tracking-widest mt-0.5">Adjustment System</p>
          </div>
        </div>
        <div className="h-px bg-white/10" />
      </div>

      <div className="flex-1 flex flex-col gap-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded text-left text-body-md font-medium transition-colors relative ${
                isActive
                  ? 'bg-primary-container/30 text-white'
                  : 'text-on-primary/70 hover:text-white hover:bg-primary-container/20'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r" aria-hidden="true" />}
                <item.icon size={22} strokeWidth={1.5} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <>
            <div className="my-2 border-t border-white/10" />
            {adminNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded text-left text-body-md font-medium transition-colors relative ${
                    isActive
                      ? 'bg-primary-container/30 text-white'
                      : 'text-on-primary/70 hover:text-white hover:bg-primary-container/20'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-primary rounded-r" aria-hidden="true" />}
                    <item.icon size={22} strokeWidth={1.5} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </div>
    </nav>
  );
}
