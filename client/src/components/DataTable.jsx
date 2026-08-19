import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../lib/utils.js';

export function DataTable({ columns, rows, loading, sortField, sortOrder, onSort, rowActions, keyExtractor, onRowClick, emptyState, bare }) {
  const containerClass = bare ? '' : 'bg-surface border border-surface-border rounded shadow-sm overflow-hidden';

  if (loading) {
    return (
      <div className={`${containerClass} p-8 text-center`}>
        <p className="text-body-md text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  if (!rows?.length) {
    return (
      <div className={`${containerClass} overflow-hidden`}>
        {emptyState || (
          <div className="p-8 text-center">
            <p className="text-body-md text-on-surface-variant">No records found.</p>
          </div>
        )}
      </div>
    );
  }

  const sortIcon = (field) => {
    if (!onSort) return null;
    if (sortField !== field) return <ArrowUpDown size={14} className="text-outline" />;
    return sortOrder === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />;
  };

  return (
    <div className={containerClass}>
      <table className="w-full text-left">
        <thead className="bg-surface-container-high text-on-surface-variant text-label-md uppercase sticky top-0">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn('px-4 py-3 font-medium', onSort && col.sortable !== false ? 'cursor-pointer hover:text-primary' : '')}
                onClick={() => onSort && col.sortable !== false && onSort(col.key)}
              >
                <div className={cn('flex items-center gap-1', col.align === 'right' ? 'justify-end' : '')}>
                  {col.title}
                  {col.sortable !== false && sortIcon(col.key)}
                </div>
              </th>
            ))}
            {rowActions && <th className="px-4 py-3 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border text-body-md">
          {rows.map((row, idx) => (
            <tr
              key={keyExtractor ? keyExtractor(row, idx) : row.id}
              className={cn('hover:bg-surface-container-low', onRowClick && 'cursor-pointer')}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3',
                    col.className,
                    col.align === 'right' ? 'text-right' : '',
                    col.monospace ? 'font-mono' : ''
                  )}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              {rowActions && <td className="px-4 py-3 text-right">{rowActions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
