import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClaims, exportClaims } from '../services/claim.service.js';
import { getClaimStatuses } from '../services/master-data.service.js';
import { formatCurrency } from '../utils/currency.js';
import { useList } from '../hooks/useList.js';
import { DataTable } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { Download } from 'lucide-react';

function StatusPill({ code, color }) {
  return (
    <span
      className="inline-flex items-center px-3 py-0.5 rounded-full text-label-md font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {code}
    </span>
  );
}

export default function Claims() {
  const {
    page,
    setPage,
    limit,
    setLimit,
    search,
    applySearch,
    filters,
    applyFilters,
    sortField,
    sortOrder,
    onSort,
    refresh,
  } = useList();

  const [data, setData] = useState({ items: [], count: 0 });
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getClaimStatuses().then((res) => setStatuses(res.items || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      page,
      limit,
      search,
      status: filters.status || '',
      sortField,
      sortOrder,
    };
    getClaims(params)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [page, limit, search, filters, sortField, sortOrder, refresh]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportClaims({ search, status: filters.status });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `claims-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: 'claimNumber', title: 'Claim #', sortable: true, className: 'font-mono text-body-md font-medium text-primary' },
    { key: 'client', title: 'Client', render: (row) => row.client?.name },
    { key: 'claimType', title: 'Type', render: (row) => row.claimType?.name },
    { key: 'status', title: 'Status', render: (row) => <StatusPill code={row.status?.code} color={row.status?.color} /> },
    { key: 'engineer', title: 'Engineer', render: (row) => row.engineer?.fullName || '—' },
    {
      key: 'reserve',
      title: 'Reserve',
      sortable: true,
      align: 'right',
      className: 'font-mono',
      render: (row) => formatCurrency(row.reserve),
    },
    {
      key: 'dateReceived',
      title: 'Received',
      sortable: true,
      render: (row) => (row.dateReceived ? new Date(row.dateReceived).toLocaleDateString() : '—'),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">Claims</h2>
              <p className="text-body-md text-on-surface-variant mt-1">Manage and track all claims.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded border border-outline text-body-md hover:bg-surface-container-low disabled:opacity-50"
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                onClick={() => navigate('/claims/new')}
                className="bg-primary text-white px-4 py-2 rounded text-label-md uppercase hover:bg-primary-container transition-colors"
              >
                + New Claim
              </button>
            </div>
          </div>

          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 mb-6 flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Search claim number, client, or description"
              className="flex-1 h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
            <select
              value={filters.status || ''}
              onChange={(e) => applyFilters({ ...filters, status: e.target.value })}
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <DataTable
            columns={columns}
            rows={data.items}
            loading={loading}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={onSort}
            keyExtractor={(row) => row.id}
          />

          <Pagination
            page={page}
            limit={limit}
            total={data.count}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        </main>
      </div>
    </div>
  );
}
