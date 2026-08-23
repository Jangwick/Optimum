import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { getClaims, exportClaims } from '../services/claim.service.js';
import { getProcessStatuses } from '../services/process-status.service.js';
import { useList } from '../hooks/useList.js';
import { DataTable } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { Select } from '../components/Select.jsx';
import { AppLayout } from '../components/AppLayout.jsx';
import { toast } from 'sonner';

export default function Registry() {
  const [processStatuses, setProcessStatuses] = useState([]);
  const { items, count, page, limit, loading, setFilters, setPage } = useList(getClaims, {
    limit: 25,
    initialParams: { sortField: 'dateReceived', sortOrder: 'desc' },
  });

  // Load process statuses for filter dropdown
  useState(() => {
    getProcessStatuses().then((res) => setProcessStatuses(res.items)).catch(() => {});
  }, []);

  const [search, setSearch] = useState('');
  const [processStatus, setProcessStatus] = useState('');

  const handleSearch = (e) => {
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

  const columns = [
    { key: 'claimNumber', label: 'Claim #', sortable: true },
    { key: 'assignmentNumber', label: 'Assignment #', render: (v) => v || '—' },
    { key: 'client', label: 'Client', render: (v) => v?.name || '—' },
    { key: 'insuranceCompany', label: 'Insurer', render: (v) => v?.name || '—' },
    { key: 'broker', label: 'Broker', render: (v) => v?.name || '—' },
    { key: 'processStatus', label: 'Process Status', render: (v) => (
      v ? <span className="px-2 py-0.5 rounded text-label-sm" style={{ backgroundColor: `${v.color}20`, color: v.color }}>{v.name}</span> : '—'
    )},
    { key: 'engineer', label: 'Engineer', render: (v) => v?.fullName || '—' },
    { key: 'dateReceived', label: 'Received', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'claimedAmount', label: 'Claimed', render: (v) => v ? `₱${Number(v).toLocaleString()}` : '—' },
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claim #, assignment #, insurer claim #, description..."
                className="w-full pl-10 pr-4 py-2 rounded border border-outline-variant bg-surface text-body-md text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <Select
              value={processStatus}
              onChange={(v) => setProcessStatus(v)}
              options={[
                { value: '', label: 'All Statuses' },
                ...processStatuses.map((s) => ({ value: s.code, label: s.name })),
              ]}
              placeholder="All Statuses"
              className="min-w-[180px]"
            />
            <button type="submit" className="px-4 py-2 rounded bg-surface-variant/20 text-on-surface text-label-md hover:bg-surface-variant/30 transition-colors">
              Search
            </button>
          </form>

          <DataTable columns={columns} data={items} loading={loading} rowKey="id" />

          <Pagination
            page={page}
            limit={limit}
            total={count}
            onPageChange={setPage}
          />
    </AppLayout>
  );
}
