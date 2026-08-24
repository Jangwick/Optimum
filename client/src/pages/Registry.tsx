import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { Download, Search } from 'lucide-react';
import { getClaims, exportClaims } from '../services/claim.service.js';
import { getProcessStatuses } from '../services/process-status.service.js';
import { useList } from '../hooks/useList.js';
import { DataTable, type Column } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { Select } from '../components/Select.jsx';
import { AppLayout } from '../components/AppLayout.jsx';
import { toast } from 'sonner';

export default function Registry() {
  const [processStatuses, setProcessStatuses] = useState<Record<string, unknown>[]>([]);
  const { page, setPage, limit, setLimit, filters, setFilters } = useList({ initialLimit: 25 });

  const [search, setSearch] = useState('');
  const [processStatus, setProcessStatus] = useState('');
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load process statuses for filter dropdown
  useEffect(() => {
    getProcessStatuses()
      .then((res) => {
        const response = res as Record<string, unknown>;
        setProcessStatuses((response['items'] as Record<string, unknown>[] | undefined) ?? []);
      })
      .catch(() => {});
  }, []);

  // Fetch the registry list whenever pagination, filters, or sort changes
  useEffect(() => {
    setLoading(true);
    getClaims({
      page,
      limit,
      search: (filters['search'] as string | undefined) ?? '',
      processStatus: (filters['processStatus'] as string | undefined) ?? '',
    })
      .then((res) => {
        const response = res as Record<string, unknown>;
        setItems((response['items'] as Record<string, unknown>[] | undefined) ?? []);
        setCount((response['count'] as number | undefined) ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, limit, filters]);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFilters({ search, processStatus });
  };

  const handleExport = async () => {
    try {
      const blob = await exportClaims({ search, processStatus });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claims-registry-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const columns: Column[] = [
    { key: 'claimNumber', title: 'Claim #', sortable: true },
    {
      key: 'assignmentNumber',
      title: 'Assignment #',
      render: (row) => (row['assignmentNumber'] as string | undefined) || '—',
    },
    {
      key: 'client',
      title: 'Client',
      render: (row) =>
        ((row['client'] as Record<string, unknown> | undefined)?.['name'] as string | undefined) ||
        '—',
    },
    {
      key: 'insuranceCompany',
      title: 'Insurer',
      render: (row) =>
        ((row['insuranceCompany'] as Record<string, unknown> | undefined)?.['name'] as string | undefined) ||
        '—',
    },
    {
      key: 'broker',
      title: 'Broker',
      render: (row) =>
        ((row['broker'] as Record<string, unknown> | undefined)?.['name'] as string | undefined) ||
        '—',
    },
    {
      key: 'processStatus',
      title: 'Process Status',
      render: (row) => {
        const v = row['processStatus'] as Record<string, unknown> | undefined;
        return v ? (
          <span
            className="px-2 py-0.5 rounded text-label-sm"
            style={{
              backgroundColor: `${v['color'] as string}20`,
              color: v['color'] as string,
            }}
          >
            {v['name'] as string}
          </span>
        ) : (
          '—'
        );
      },
    },
    {
      key: 'engineer',
      title: 'Engineer',
      render: (row) =>
        ((row['engineer'] as Record<string, unknown> | undefined)?.['fullName'] as string | undefined) ||
        '—',
    },
    {
      key: 'dateReceived',
      title: 'Received',
      render: (row) => {
        const v = row['dateReceived'] as string | undefined;
        return v ? new Date(v).toLocaleDateString() : '—';
      },
    },
    {
      key: 'claimedAmount',
      title: 'Claimed',
      render: (row) => {
        const v = row['claimedAmount'] as number | string | undefined;
        return v ? `₱${Number(v).toLocaleString()}` : '—';
      },
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-headline-md font-semibold text-on-surface">Claims Registry</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Complete claim register with OCS process status
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded bg-primary text-on-primary text-label-md hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Download size={16} strokeWidth={1.5} />
          Export Excel
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search claim #, assignment #, insurer claim #, description..."
            className="w-full pl-10 pr-4 py-2 rounded border border-outline-variant bg-surface text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        <Select
          value={processStatus}
          onChange={(v) => setProcessStatus(v as string)}
          options={[
            { value: '', label: 'All Statuses' },
            ...processStatuses.map((s) => ({
              value: s['code'] as string | number,
              label: s['name'] as string,
            })),
          ]}
          placeholder="All Statuses"
          className="min-w-[180px]"
        />
        <button type="submit" className="px-4 py-2 rounded bg-surface-variant/20 text-on-surface text-label-md hover:bg-surface-variant/30 transition-colors">
          Search
        </button>
      </form>

      <DataTable
        columns={columns}
        rows={items}
        loading={loading}
        keyExtractor={(row) => row['id'] as string | number}
      />

      <Pagination
        page={page}
        limit={limit}
        total={count}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </AppLayout>
  );
}
