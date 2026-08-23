import { createContext, useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Maps URL path segments to human-readable labels.
const SEGMENT_LABELS = {
  claims: 'Claims',
  new: 'New Claim',
  employees: 'Employees',
  'master-data': 'Master Data',
  'audit-logs': 'Audit Logs',
  reports: 'Reports & Analytics',
};

// When a dynamic segment (e.g. an ID) follows one of these parents,
// show this label instead of the raw ID.
const DYNAMIC_LABELS = {
  claims: 'Claim Details',
};

function buildBreadcrumbs(pathname, dynamicLabel) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Overview', path: '/' }];

  if (segments.length === 0) return crumbs;

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    currentPath += `/${seg}`;

    if (SEGMENT_LABELS[seg]) {
      crumbs.push({ label: SEGMENT_LABELS[seg], path: currentPath });
    } else {
      const parent = segments[i - 1];
      const isLast = i === segments.length - 1;
      // If the page set a dynamic label and this is the last segment, use it
      if (isLast && dynamicLabel) {
        crumbs.push({ label: dynamicLabel, path: currentPath });
      } else {
        const dynamicFallback = DYNAMIC_LABELS[parent];
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

// Context that lets pages set a dynamic label for the last breadcrumb
// (e.g. ClaimDetail can set the actual claim number).
const BreadcrumbContext = createContext(null);

export function useBreadcrumb(label) {
  const setter = useContext(BreadcrumbContext);
  useEffect(() => {
    if (setter) setter(label);
  }, [label, setter]);
}

export function BreadcrumbProvider({ children }) {
  const location = useLocation();

  // Reset dynamic label on route change
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
  const [dynamicLabel, setDynamicLabel] = useState(null);

  // Listen for dynamic label updates from pages via a simple event
  useEffect(() => {
    const handler = (e) => setDynamicLabel(e.detail);
    window.addEventListener('breadcrumb-label', handler);
    return () => window.removeEventListener('breadcrumb-label', handler);
  }, []);

  // Reset on route change
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

// Helper for pages to set their breadcrumb label
export function setBreadcrumbLabel(label) {
  window.dispatchEvent(new CustomEvent('breadcrumb-label', { detail: label }));
}
