import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs.jsx';
import { NotificationsDropdown } from './NotificationsDropdown.jsx';
import { HelpDropdown } from './HelpDropdown.jsx';
import { SettingsDropdown } from './SettingsDropdown.jsx';
import { api } from '../services/api.js';

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/claims', { params: { search: query, limit: 5, page: 1, view: 'all' } });
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
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (claimId) => {
    navigate(`/claims/${claimId}`);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-64">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search claims..."
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-border bg-surface-container-low text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
          aria-label="Global search"
        />
      </div>
      {open && (query.trim().length > 0) && (
        <div className="absolute right-0 top-11 z-50 bg-surface border border-surface-border rounded-lg shadow-lg min-w-[320px] max-w-[400px]">
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

export function TopBar() {
  return (
    <header className="h-16 bg-surface border-b border-surface-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 min-w-0">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <GlobalSearch />
        <NotificationsDropdown />
        <HelpDropdown />
        <div className="h-8 w-px bg-surface-border mx-2" />
        <SettingsDropdown />
      </div>
    </header>
  );
}
