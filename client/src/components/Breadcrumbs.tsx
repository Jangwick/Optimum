import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  path: string;
}

const SEGMENT_LABELS: Record<string, string> = {
  claims: 'Claims',
  new: 'New Claim',
  employees: 'Employees',
  'master-data': 'Master Data',
  'audit-logs': 'Audit Logs',
  reports: 'Reports & Analytics',
};

const DYNAMIC_LABELS: Record<string, string> = {
  claims: 'Claim Details',
};

function buildBreadcrumbs(pathname: string, dynamicLabel: string | null): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: 'Overview', path: '/' }];

  if (segments.length === 0) return crumbs;

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    currentPath += `/${seg}`;

    if (SEGMENT_LABELS[seg]) {
      crumbs.push({ label: SEGMENT_LABELS[seg], path: currentPath });
    } else {
      const parent = i > 0 ? segments[i - 1]! : undefined;
      const isLast = i === segments.length - 1;
      if (isLast && dynamicLabel) {
        crumbs.push({ label: dynamicLabel, path: currentPath });
      } else {
        const dynamicFallback = parent ? DYNAMIC_LABELS[parent] : undefined;
        if (dynamicFallback) {
          crumbs.push({ label: dynamicFallback, path: currentPath });
        } else if (seg.length <= 20) {
          crumbs.push({ label: seg, path: currentPath });
        } else {
          crumbs.push({ label: `${seg.slice(0, 12)}…`, path: currentPath });
        }
      }
    }
  }

  return crumbs;
}

const BreadcrumbContext = createContext<((label: string) => void) | null>(null);

export function useBreadcrumb(label: string) {
  const setter = useContext(BreadcrumbContext);
  useEffect(() => {
    if (setter) setter(label);
  }, [label, setter]);
}

interface BreadcrumbProviderProps {
  children: ReactNode;
}

export function BreadcrumbProvider({ children }: BreadcrumbProviderProps) {
  const location = useLocation();

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('breadcrumb-label', { detail: null }));
  }, [location.pathname]);

  return (
    <BreadcrumbContext.Provider value={null}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function Breadcrumbs() {
  const location = useLocation();
  const [dynamicLabel, setDynamicLabel] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => setDynamicLabel((e as CustomEvent<string | null>).detail);
    window.addEventListener('breadcrumb-label', handler);
    return () => window.removeEventListener('breadcrumb-label', handler);
  }, []);

  useEffect(() => {
    setDynamicLabel(null);
  }, [location.pathname]);

  const crumbs = buildBreadcrumbs(location.pathname, dynamicLabel);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-body-md min-w-0">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <div key={crumb.path} className="flex items-center gap-1.5 min-w-0">
            {idx === 0 && <Home size={16} className="text-outline shrink-0" />}
            {idx > 0 && <ChevronRight size={16} className="text-outline shrink-0" />}
            {isLast ? (
              <span className="text-on-surface font-medium truncate" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-on-surface-variant hover:text-primary transition-colors truncate"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function setBreadcrumbLabel(label: string) {
  window.dispatchEvent(new CustomEvent('breadcrumb-label', { detail: label }));
}
