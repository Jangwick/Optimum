import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from './Select.jsx';

export function Pagination({ page, limit, total, onPageChange, onLimitChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
      <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <span>Rows per page:</span>
        <div className="w-20">
          <Select
            value={limit}
            onChange={(v) => onLimitChange(Number(v))}
            options={[10, 25, 50, 100].map((n) => ({ value: n, label: String(n) }))}
            className="h-8 text-body-sm"
          />
        </div>
        <span>
          {start}-{end} of {total}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-body-sm text-on-surface-variant min-w-[4rem] text-center">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
