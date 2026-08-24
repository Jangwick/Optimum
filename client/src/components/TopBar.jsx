import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, Shield, User, Menu, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs.jsx';
import { NotificationsDropdown } from './NotificationsDropdown.jsx';
import { HelpDropdown } from './HelpDropdown.jsx';
import { SettingsDropdown } from './SettingsDropdown.jsx';
import { searchAll } from '../services/search.service.js';


const GROUPS = ['claims', 'clients', 'policies', 'users'];

const GROUP_CONFIG = {
  claims: { label: 'Claims', icon: FileText, viewAll: (q) => `/claims?search=${encodeURIComponent(q)}` },
  clients: { label: 'Clients', icon: Users, viewAll: (q) => `/master-data?tab=clients&search=${encodeURIComponent(q)}` },
  policies: { label: 'Policies', icon: Shield, viewAll: (q) => `/master-data?tab=policies&search=${encodeURIComponent(q)}` },
  users: { label: 'People', icon: User, viewAll: (q) => `/employees?search=${encodeURIComponent(q)}` },
};

const RESULT_URL = {
  claim: (item) => `/claims/${item.id}`,
  client: (item) => `/master-data?tab=clients&search=${encodeURIComponent(item.title)}`,
  policy: (item) => `/master-data?tab=policies&search=${encodeURIComponent(item.title)}`,
  user: (item) => `/employees?search=${encodeURIComponent(item.title)}`,
};

function ResultIcon({ type }) {
  const Icon = GROUP_CONFIG[type === 'claim' ? 'claims' : `${type}s`]?.icon || FileText;
  return <Icon size={16} />;
}

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState({ claims: [], clients: [], policies: [], users: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const flattened = useMemo(() => {
    const items = [];
    GROUPS.forEach((type) => {
      const groupItems = groups[type] || [];
      groupItems.forEach((item) => items.push({ ...item, group: type }));
    });
    return items;
  }, [groups]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setGroups({ claims: [], clients: [], policies: [], users: [] });
      setActiveIndex(-1);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchAll(query, 3);
        setGroups(res.groups || { claims: [], clients: [], policies: [], users: [] });
        setActiveIndex(-1);
      } catch {
        setGroups({ claims: [], clients: [], policies: [], users: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setGroups({ claims: [], clients: [], policies: [], users: [] });
    setActiveIndex(-1);
  }, []);

  const navigateTo = useCallback(
    (item) => {
      const url = RESULT_URL[item.type](item);
      close();
      navigate(url);
    },
    [navigate, close],
  );

  const navigateToViewAll = useCallback(
    (groupKey) => {
      const url = GROUP_CONFIG[groupKey].viewAll(query);
      close();
      navigate(url);
    },
    [navigate, query, close],
  );

  const handleKeyDown = (e) => {
    if (!open) return;

    const maxIndex = flattened.length - 1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i >= maxIndex ? 0 : i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? maxIndex : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0 && flattened[activeIndex]) {
      e.preventDefault();
      navigateTo(flattened[activeIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item) => {
    navigateTo(item);
  };

  const totalCount = useMemo(
    () => GROUPS.reduce((sum, g) => sum + (groups[g]?.length || 0), 0),
    [groups],
  );

  const renderGroup = (groupKey) => {
    const items = groups[groupKey] || [];
    if (items.length === 0) return null;
    const { label, icon: GroupIcon } = GROUP_CONFIG[groupKey];

    return (
      <div key={groupKey} className="py-1 border-b border-surface-border last:border-0">
        <div className="px-3 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-label-md font-medium text-outline uppercase">
            <GroupIcon size={14} />
            {label}
          </div>
          <button
            onClick={() => navigateToViewAll(groupKey)}
            className="text-label-sm text-primary hover:text-primary-container flex items-center gap-0.5"
            aria-label={`View all ${label.toLowerCase()} results`}
          >
            View all
            <ChevronRight size={14} />
          </button>
        </div>
        {items.map((item) => {
          const globalIndex = flattened.findIndex((f) => f.id === item.id && f.type === item.type);
          const isActive = globalIndex === activeIndex;
          return (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(globalIndex)}
              className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-3 ${
                isActive ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'
              }`}
              aria-label={`${item.title} ${item.subtitle || ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ResultIcon type={item.type} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-on-surface font-mono truncate">{item.title}</p>
                <p className="text-label-md text-on-surface-variant truncate">{item.subtitle}</p>
              </div>
              {item.status && <span className="text-label-md text-on-surface-variant shrink-0">{item.status}</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative shrink-0 w-32 sm:w-48 lg:w-64">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-border bg-surface-container-low text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          aria-label="Global search"
        />
      </div>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 bg-surface border border-surface-border rounded-lg shadow-lg w-[280px] sm:w-[320px] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto"
          onKeyDown={handleKeyDown}
          role="listbox"
          aria-label="Search results"
        >
          {loading ? (
            <div className="p-4 text-body-sm text-on-surface-variant text-center">Searching...</div>
          ) : query.trim().length > 0 ? (
            totalCount > 0 ? (
              <div className="py-1">{GROUPS.map(renderGroup)}</div>
            ) : (
              <div className="p-4 text-body-sm text-on-surface-variant text-center">No results found.</div>
            )
          ) : (
            <div className="p-4 text-body-sm text-on-surface-variant text-center">Start typing to search.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function TopBar({ onMenuClick }) {
  return (
    <header className="h-16 bg-surface border-b border-surface-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 text-on-surface hover:bg-surface-container-low rounded-lg shrink-0"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="hidden sm:block min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <GlobalSearch />
        <NotificationsDropdown />
        <HelpDropdown />
        <div className="h-8 w-px bg-surface-border mx-1 sm:mx-2" />
        <SettingsDropdown />
      </div>
    </header>
  );
}
