import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClaims, exportClaims } from '../services/claim.service.js';
import { getProcessStatuses } from '../services/import.service.js';
import { formatCurrency } from '../utils/currency.js';
import { useList } from '../hooks/useList.js';
import { DataTable } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { Download, Lock, Ban } from 'lucide-react';

function StatusPill({ code, color, name }) {
  return (
    <span
      className="inline-flex items-center px-3 py-0.5 rounded-full text-label-md font-medium"
      style={{ backgroundColor: `${color}20`, color }}
      title={name || code}
    >
      {name || code}
    </span>
  );
}

function ReadOnlyBadge({ isReadOnly, isCancelled }) {
  if (!isReadOnly) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-medium ${
        isCancelled ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
      }`}
      title={isCancelled ? 'Cancelled historical record (read-only)' : 'Closed historical record (read-only)'}
    >
      {isCancelled ? <Ban size={12} /> : <Lock size={12} />}
      {isCancelled ? 'Cancelled' : 'Closed'}
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
  const [processStatuses, setProcessStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getProcessStatuses().then((res) => setProcessStatuses(res.items || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      page,
      limit,
      search,
      processStatus: filters.processStatus || '',
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
      const blob = await exportClaims({ search, processStatus: filters.processStatus });
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `claims-registry-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: 'claimNumber',
      title: 'OCS Ref #',
      sortable: true,
      className: 'font-mono text-body-md font-medium text-primary',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.claimNumber}</span>
          <ReadOnlyBadge isReadOnly={row.isReadOnly} isCancelled={row.isCancelled} />
        </div>
      ),
    },
    { key: 'client', title: 'Insured', render: (row) => row.client?.name || row.insuredName || '—' },
    { key: 'insuranceCompany', title: 'Insurer', render: (row) => row.insuranceCompany?.name || '—' },
    { key: 'broker', title: 'Broker', render: (row) => row.broker?.name || '—' },
    {
      key: 'processStatus',
      title: 'Status',
      render: (row) =>
        row.processStatus ? (
          <StatusPill code={row.processStatus.code} color={row.processStatus.color} name={row.processStatus.name} />
        ) : (
          '—'
        ),
    },
    { key: 'engineer', title: 'Adjuster', render: (row) => row.engineer?.fullName || row.handlingAdjuster || '—' },
    {
      key: 'claimedAmount',
      title: 'Claimed',
      sortable: true,
      align: 'right',
      className: 'font-mono',
      render: (row) => (row.claimedAmount ? formatCurrency(row.claimedAmount) : row.claimedAmountRaw || '—'),
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
              <h2 className="text-headline-lg font-semibold text-primary">Claims Registry</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                Complete claim register with 18-stage workflow status
              </p>
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

          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 mb-6 flex gap-4 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Search OCS ref, insured, insurer claim #, policy, broker, nature, location..."
              className="flex-1 min-w-[300px] h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
            <select
              value={filters.processStatus || ''}
              onChange={(e) => applyFilters({ ...filters, processStatus: e.target.value })}
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              {processStatuses.map((s) => (
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
            onRowClick={(row) => navigate(`/claims/${row.id}`)}
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
