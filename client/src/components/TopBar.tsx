import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Menu } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs.jsx';
import { NotificationsDropdown } from './NotificationsDropdown.jsx';
import { HelpDropdown } from './HelpDropdown.jsx';
import { SettingsDropdown } from './SettingsDropdown.jsx';
import { api } from '../services/api.js';

interface ClaimSearchResult {
  id: number;
  claimNumber: string;
  client?: { name?: string } | null;
  insuredName?: string | null;
  status?: { name?: string } | null;
}

interface GlobalSearchProps {
  className?: string;
}

function GlobalSearch({ className = '' }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClaimSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = (await api.get('/claims', { params: { search: query, limit: 5, page: 1, view: 'all' } })) as { data: { items: ClaimSearchResult[] } };
        setResults(res.data.items || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (claimId: number) => {
    navigate(`/claims/${claimId}`);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-32 sm:w-48 lg:w-64 ${className}`}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-border bg-surface-container-low text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          aria-label="Global search"
        />
      </div>
      {open && (query.trim().length > 0) && (
        <div className="absolute right-0 top-11 z-50 bg-surface border border-surface-border rounded-lg shadow-lg w-[280px] sm:w-[320px] max-w-[calc(100vw-2rem)]">
          {loading ? (
            <div className="p-4 text-body-sm text-on-surface-variant text-center">Searching...</div>
          ) : results.length > 0 ? (
            <div className="py-1 max-h-[400px] overflow-y-auto">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-surface-container-low transition-colors flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-on-surface font-mono truncate">{c.claimNumber}</p>
                    <p className="text-label-md text-on-surface-variant truncate">
                      {c.client?.name || c.insuredName || '—'}
                    </p>
                  </div>
                  {c.status && (
                    <span className="text-label-md text-on-surface-variant shrink-0">{c.status.name}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-body-sm text-on-surface-variant text-center">No claims found.</div>
          )}
        </div>
      )}
    </div>
  );
}

interface TopBarProps {
  onMenuClick?: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
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
