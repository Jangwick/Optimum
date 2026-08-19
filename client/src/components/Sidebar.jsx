import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  FileSpreadsheet,
  History,
  LogOut,
  Upload,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Claims', href: '/claims' },
  { icon: ClipboardList, label: 'Registry', href: '/registry' },
  { icon: Users, label: 'Employees', href: '/employees' },
  { icon: Building2, label: 'Master Data', href: '/master-data' },
  { icon: FileSpreadsheet, label: 'Templates', href: '/templates' },
  { icon: History, label: 'Audit Logs', href: '/audit-logs' },
];

const adminNavItems = [
  { icon: Upload, label: 'Import Wizard', href: '/imports' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] bg-sidebar-bg text-white flex flex-col py-4 z-20">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="Optimum Logo" className="w-8 h-8 object-contain" />
          <h1 className="text-headline-sm font-semibold text-white">Optimum Claims</h1>
        </div>
        <p className="text-label-md text-on-primary/70 uppercase tracking-widest">Adjustment System</p>
      </div>

      <div className="flex-1 flex flex-col gap-1 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded text-left text-label-md transition-colors relative ${
                isActive
                  ? 'bg-primary-container/30 text-white'
                  : 'text-on-primary/70 hover:text-white hover:bg-primary-container/20'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" aria-hidden="true" />}
                <item.icon size={20} strokeWidth={1.5} />
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
                  `flex items-center gap-3 px-4 py-3 rounded text-left text-label-md transition-colors relative ${
                    isActive
                      ? 'bg-primary-container/30 text-white'
                      : 'text-on-primary/70 hover:text-white hover:bg-primary-container/20'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" aria-hidden="true" />}
                    <item.icon size={20} strokeWidth={1.5} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}
      </div>

      <div className="px-4 mt-auto flex flex-col gap-1">
        <div className="px-4 py-3 flex items-center gap-3 text-on-primary/70 border-t border-white/10 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-label-md font-semibold">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-body-sm text-white truncate">{user?.fullName}</p>
            <p className="text-label-sm text-on-primary/70 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded text-left text-on-primary/70 hover:text-white hover:bg-primary-container/20 transition-colors text-label-md"
        >
          <LogOut size={20} strokeWidth={1.5} />
          Logout
        </button>
      </div>
    </nav>
  );
}
