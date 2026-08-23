import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClaims, exportClaims } from '../services/claim.service.js';
import { getClaimStatuses, getClaimTypes, getClients, getInsuranceCompanies } from '../services/master-data.service.js';
import { getUsers } from '../services/user.service.js';
import { formatCurrency } from '../utils/currency.js';
import { useList } from '../hooks/useList.js';
import { DataTable } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { NewClaimModal } from '../components/NewClaimModal.jsx';
import { Select } from '../components/Select.jsx';
import { AppLayout } from '../components/AppLayout.jsx';
import {
  Download,
  Lock,
  Ban,
  Plus,
  Search,
  ClipboardList,
  FileText,
  Building2,
  Users,
  Calendar,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
} from 'lucide-react';

// Semantic color mapping for internal claim statuses.
// Maps status codes to design-system token colors so each workflow stage
// has a visually distinct, meaningful color.
const STATUS_COLORS = {
  NEW: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  ASSIGNED: { bg: 'bg-primary-container/15', text: 'text-primary-container', dot: 'bg-primary-container' },
  INVESTIGATION: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  INSPECTION_SCHEDULED: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  INSPECTION_COMPLETED: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  DOCUMENTS_PENDING: { bg: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
  DOCUMENTS_RECEIVED: { bg: 'bg-success-green/10', text: 'text-success-green', dot: 'bg-success-green' },
  ASSESSMENT: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  REPORT_DRAFT: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  REPORT_SUBMITTED: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  CLIENT_REVIEW: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  CLARIFICATION_NEEDED: { bg: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
  CLARIFICATION_PROVIDED: { bg: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
  SETTLEMENT: { bg: 'bg-primary-container/15', text: 'text-primary-container', dot: 'bg-primary-container' },
  OFFER_SENT: { bg: 'bg-primary-container/15', text: 'text-primary-container', dot: 'bg-primary-container' },
  FEE_INVOICED: { bg: 'bg-primary-container/15', text: 'text-primary-container', dot: 'bg-primary-container' },
  PAYMENT_RECEIVED: { bg: 'bg-success-green/10', text: 'text-success-green', dot: 'bg-success-green' },
  CLOSED: { bg: 'bg-success-green/10', text: 'text-success-green', dot: 'bg-success-green' },
  CANCELLED: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
};

function StatusPill({ code, name }) {
  const colors = STATUS_COLORS[code] || { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}
      title={name || code}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
      {name || code}
    </span>
  );
}

function ReadOnlyBadge({ isReadOnly, isCancelled }) {
  if (!isReadOnly) return null;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-label-sm font-medium shrink-0 ${
        isCancelled ? 'bg-error/10 text-error' : 'bg-surface-container-high text-on-surface-variant'
      }`}
      title={isCancelled ? 'Cancelled historical record (read-only)' : 'Closed historical record (read-only)'}
    >
      {isCancelled ? <Ban size={10} /> : <Lock size={10} />}
    </span>
  );
}

const ALL_COLUMNS = [
  { key: 'claimNumber', label: 'OCS Ref #', default: true },
  { key: 'client', label: 'Insured', default: true },
  { key: 'insuranceCompany', label: 'Insurer', default: true },
  { key: 'broker', label: 'Broker', default: true },
  { key: 'status', label: 'Status', default: true },
  { key: 'engineer', label: 'Adjuster', default: true },
  { key: 'claimedAmount', label: 'Claimed', default: true },
  { key: 'dateReceived', label: 'Received', default: true },
  { key: 'natureOfLoss', label: 'Nature', default: false },
  { key: 'locationOfLoss', label: 'Location', default: false },
  { key: 'policyNumber', label: 'Policy #', default: false },
  { key: 'dateOfLoss', label: 'Date of Loss', default: false },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
  const [globalCounts, setGlobalCounts] = useState({ total: 0, active: 0, closed: 0, cancelled: 0 });
  const [claimStatuses, setClaimStatuses] = useState([]);
  const [claimTypes, setClaimTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [insurers, setInsurers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [view, setView] = useState('active');
  const [visibleCols, setVisibleCols] = useState(
    () => Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, c.default]))
  );
  const navigate = useNavigate();
  const [showNewClaim, setShowNewClaim] = useState(false);

  // Load filter reference data once
  useEffect(() => {
    Promise.all([
      getClaimStatuses(),
      getClaimTypes(),
      getClients(),
      getInsuranceCompanies(),
      getUsers(),
    ])
      .then(([statuses, types, clientsData, insurersData, usersData]) => {
        setClaimStatuses(statuses.items || []);
        setClaimTypes(types.items || []);
        setClients(clientsData.items || []);
        setInsurers(insurersData.items || []);
        setEngineers((usersData.users || []).filter((u) => u.role === 'ENGINEER' || u.role === 'ACCOUNTANT'));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {
      page,
      limit,
      search,
      status: filters.status || '',
      processStatus: filters.processStatus || '',
      claimType: filters.claimType || '',
      clientId: filters.clientId || '',
      engineerId: filters.engineerId || '',
      view,
      sortField,
      sortOrder,
    };
    getClaims(params)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [page, limit, search, filters, view, sortField, sortOrder, refresh]);

  // Fetch global counts (not filtered by view) for metric cards
  useEffect(() => {
    Promise.all([
      getClaims({ page: 1, limit: 1, view: 'active' }),
      getClaims({ page: 1, limit: 1, view: 'closed' }),
      getClaims({ page: 1, limit: 1, view: 'cancelled' }),
    ])
      .then(([active, closed, cancelled]) => {
        setGlobalCounts({
          active: active.count,
          closed: closed.count,
          cancelled: cancelled.count,
          total: active.count + closed.count + cancelled.count,
        });
      })
      .catch(() => {});
  }, [refresh]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportClaims({
        search,
        status: filters.status,
        processStatus: filters.processStatus,
        claimType: filters.claimType,
        clientId: filters.clientId,
        engineerId: filters.engineerId,
        view,
      });
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

  const hasActiveFilters = search || filters.status || filters.processStatus || filters.claimType || filters.clientId || filters.engineerId || view !== 'active';
  const activeFilterCount = [
    filters.status,
    filters.processStatus,
    filters.claimType,
    filters.clientId,
    filters.engineerId,
  ].filter(Boolean).length + (view !== 'active' ? 1 : 0);

  const summaryStats = useMemo(() => {
    const items = data.items;
    const totalClaimed = items.reduce((sum, c) => {
      const amt = parseFloat(c.claimedAmount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    return {
      active: globalCounts.active,
      readOnly: globalCounts.closed,
      cancelled: globalCounts.cancelled,
      totalClaimed,
      total: globalCounts.total,
    };
  }, [data, globalCounts]);

  const columns = [
    {
      key: 'claimNumber',
      title: 'OCS Ref #',
      sortable: true,
      className: 'font-mono text-body-md font-medium text-primary',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-outline shrink-0" />
          <span className="truncate">{row.claimNumber}</span>
          <ReadOnlyBadge isReadOnly={row.isReadOnly} isCancelled={row.isCancelled} />
        </div>
      ),
    },
    {
      key: 'client',
      title: 'Insured',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Users size={14} className="text-outline shrink-0" />
          <span className="truncate">{row.client?.name || row.insuredName || '—'}</span>
        </div>
      ),
    },
    {
      key: 'insuranceCompany',
      title: 'Insurer',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-outline shrink-0" />
          <span className="truncate">{row.insuranceCompany?.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'broker',
      title: 'Broker',
      render: (row) => row.broker?.name || '—',
    },
    {
      key: 'status',
      title: 'Status',
      render: (row) =>
        row.status ? (
          <StatusPill code={row.status.code} name={row.status.name} />
        ) : (
          '—'
        ),
    },
    {
      key: 'engineer',
      title: 'Adjuster',
      render: (row) => (
        <span className="text-body-sm text-on-surface-variant">
          {row.engineer?.fullName || row.handlingAdjuster || '—'}
        </span>
      ),
    },
    {
      key: 'claimedAmount',
      title: 'Claimed',
      sortable: true,
      align: 'right',
      className: 'font-mono',
      render: (row) => {
        if (row.claimedAmount) {
          return (
            <span className="text-on-surface font-medium tabular-nums">
              {formatCurrency(row.claimedAmount)}
            </span>
          );
        }
        if (row.claimedAmountRaw && row.claimedAmountRaw !== '—') {
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent-orange/10 text-accent-orange text-label-md font-medium"
              title={`Raw value from import: "${row.claimedAmountRaw}" — amount could not be parsed`}
            >
              <AlertTriangle size={11} className="shrink-0" />
              <span className="truncate max-w-[120px]">{row.claimedAmountRaw}</span>
            </span>
          );
        }
        return <span className="text-outline">—</span>;
      },
    },
    {
      key: 'dateReceived',
      title: 'Received',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <Calendar size={12} className="text-outline shrink-0" />
          <span className="text-body-sm">{formatDate(row.dateReceived)}</span>
        </div>
      ),
    },
    {
      key: 'natureOfLoss',
      title: 'Nature',
      render: (row) => <span className="text-body-sm text-on-surface-variant truncate">{row.natureOfLoss || '—'}</span>,
    },
    {
      key: 'locationOfLoss',
      title: 'Location',
      render: (row) => (
        <span className="text-body-sm text-on-surface-variant truncate max-w-[200px] block">
          {row.locationOfLoss || '—'}
        </span>
      ),
    },
    {
      key: 'policyNumber',
      title: 'Policy #',
      render: (row) => (
        <span className="text-body-sm font-mono text-on-surface-variant">{row.policyNumber || '—'}</span>
      ),
    },
    {
      key: 'dateOfLoss',
      title: 'Date of Loss',
      render: (row) => <span className="text-body-sm text-on-surface-variant">{formatDate(row.dateOfLoss)}</span>,
    },
  ].filter((col) => visibleCols[col.key]);

  const clearFilters = () => {
    applySearch('');
    applyFilters({});
    setView('active');
    setPage(1);
  };

  const setFilter = (key, value) => {
    applyFilters({ ...filters, [key]: value || undefined });
    setPage(1);
  };

  return (
    <AppLayout>
          {/* Page Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">Claims Registry</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                Complete claim register with 18-stage workflow status
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded border border-outline text-body-md font-medium hover:bg-surface-container-low disabled:opacity-50 transition-colors"
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
              <button
                onClick={() => setShowNewClaim(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-primary text-white text-body-md font-medium hover:bg-primary-container transition-colors shadow-sm"
              >
                <Plus size={16} />
                New Claim
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ClipboardList size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-label-md text-outline uppercase truncate">Total Claims</p>
                <p className="text-headline-sm font-semibold text-on-surface tabular-nums">{summaryStats.total}</p>
              </div>
            </div>
            <div className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 rounded bg-success-green/10 text-success-green flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-label-md text-outline uppercase truncate">Active (Editable)</p>
                <p className="text-headline-sm font-semibold text-on-surface tabular-nums">{summaryStats.active}</p>
              </div>
            </div>
            <div className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 rounded bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                <Lock size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-label-md text-outline uppercase truncate">Historical</p>
                <p className="text-headline-sm font-semibold text-on-surface tabular-nums">{summaryStats.readOnly}</p>
              </div>
            </div>
            <div className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 rounded bg-error/10 text-error flex items-center justify-center shrink-0">
                <Ban size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-label-md text-outline uppercase truncate">Cancelled</p>
                <p className="text-headline-sm font-semibold text-on-surface tabular-nums">{summaryStats.cancelled}</p>
              </div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex items-center gap-1 mb-4 bg-surface border border-surface-border rounded-lg p-1 w-fit">
            {[
              { key: 'active', label: 'Active', icon: ClipboardList },
              { key: 'closed', label: 'Closed', icon: Lock },
              { key: 'cancelled', label: 'Cancelled', icon: Ban },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = view === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setView(tab.key);
                    setPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-body-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Unified Table Container: Filters + Table + Pagination */}
          <div className="bg-surface border border-surface-border rounded-lg shadow-sm overflow-hidden">
            {/* Filter Bar */}
            <div className="border-b border-surface-border p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => applySearch(e.target.value)}
                    placeholder="Search OCS ref, insured, insurer, policy, broker, nature, location..."
                    className="w-full h-10 pl-10 pr-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                    aria-label="Search claims"
                  />
                </div>
                <Select
                  value={filters.status || ''}
                  onChange={(v) => setFilter('status', v)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    ...claimStatuses.map((s) => ({ value: s.code, label: s.name })),
                  ]}
                  placeholder="All Statuses"
                  ariaLabel="Filter by status"
                  className="min-w-[160px]"
                />
                {/* Action buttons: side-by-side on mobile, inline on desktop */}
                <div className="flex gap-3 sm:contents">
                  <button
                    onClick={() => setShowAdvancedFilters((v) => !v)}
                    className={`h-10 px-3 rounded border text-body-md font-medium transition-colors flex items-center gap-2 cursor-pointer flex-1 sm:flex-none justify-center sm:justify-start ${
                      showAdvancedFilters || activeFilterCount > 0
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-outline text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                    aria-label="Advanced filters"
                  >
                    <Filter size={16} />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-label-sm font-semibold">
                        {activeFilterCount}
                      </span>
                    )}
                    {showAdvancedFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {/* Column visibility toggle */}
                  <div className="relative flex-1 sm:flex-none">
                    <button
                      onClick={() => setShowColumnToggle(!showColumnToggle)}
                      className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer justify-center sm:justify-start"
                      aria-label="Toggle columns"
                    >
                      <Filter size={16} className="text-outline" />
                      <span className="hidden sm:inline">Columns</span>
                      <ChevronDown size={14} className="text-outline" />
                    </button>
                    {showColumnToggle && (
                      <div className="absolute right-0 top-12 z-20 bg-surface border border-surface-border rounded-lg shadow-lg p-3 min-w-[200px]">
                        <p className="text-label-md text-outline uppercase font-medium mb-2 px-1">Toggle Columns</p>
                        <div className="space-y-1 max-h-[300px] overflow-y-auto">
                          {ALL_COLUMNS.map((col) => (
                            <label
                              key={col.key}
                              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-low cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={visibleCols[col.key]}
                                onChange={(e) => setVisibleCols({ ...visibleCols, [col.key]: e.target.checked })}
                                className="rounded border-outline"
                              />
                              <span className="text-body-sm text-on-surface">{col.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="h-10 px-3 rounded border border-outline text-body-md text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-1.5 justify-center sm:justify-start"
                      title="Clear all filters"
                    >
                      <X size={16} />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="mt-4 pt-4 border-t border-surface-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-label-md text-outline uppercase mb-1.5">Process Status</label>
                      <Select
                        value={filters.processStatus || ''}
                        onChange={(v) => setFilter('processStatus', v)}
                        options={[
                          { value: '', label: 'All Process Statuses' },
                          ...claimStatuses.map((s) => ({ value: s.code, label: s.name })),
                        ]}
                        placeholder="All Process Statuses"
                      />
                    </div>
                    <div>
                      <label className="block text-label-md text-outline uppercase mb-1.5">Claim Type</label>
                      <Select
                        value={filters.claimType || ''}
                        onChange={(v) => setFilter('claimType', v)}
                        options={[
                          { value: '', label: 'All Types' },
                          ...claimTypes.map((t) => ({ value: t.code, label: t.name })),
                        ]}
                        placeholder="All Types"
                      />
                    </div>
                    <div>
                      <label className="block text-label-md text-outline uppercase mb-1.5">Insured (Client)</label>
                      <Select
                        value={filters.clientId || ''}
                        onChange={(v) => setFilter('clientId', v)}
                        options={[
                          { value: '', label: 'All Clients' },
                          ...clients.map((c) => ({ value: c.id, label: c.name })),
                        ]}
                        placeholder="All Clients"
                      />
                    </div>
                    <div>
                      <label className="block text-label-md text-outline uppercase mb-1.5">Insurer</label>
                      <Select
                        value={filters.insurerId || ''}
                        onChange={(v) => setFilter('insurerId', v)}
                        options={[
                          { value: '', label: 'All Insurers' },
                          ...insurers.map((i) => ({ value: i.id, label: i.name })),
                        ]}
                        placeholder="All Insurers"
                      />
                    </div>
                    <div>
                      <label className="block text-label-md text-outline uppercase mb-1.5">Adjuster</label>
                      <Select
                        value={filters.engineerId || ''}
                        onChange={(v) => setFilter('engineerId', v)}
                        options={[
                          { value: '', label: 'All Adjusters' },
                          ...engineers.map((e) => ({ value: e.id, label: `${e.fullName} (${e.role})` })),
                        ]}
                        placeholder="All Adjusters"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Data Table (bare - no own container) */}
            <DataTable
              columns={columns}
              rows={data.items}
              loading={loading}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={onSort}
              keyExtractor={(row) => row.id}
              rowActions={(row) => (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/claims/${row.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline bg-surface text-body-sm font-medium text-on-surface hover:bg-primary hover:text-white hover:border-primary transition-colors"
                  title="View claim details"
                >
                  <Eye size={14} />
                  View
                </button>
              )}
              bare
              emptyState={
                <div className="p-12 text-center">
                  <ClipboardList size={40} className="mx-auto text-outline mb-3" />
                  <p className="text-body-md font-medium text-on-surface">No claims found</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    {hasActiveFilters
                      ? 'Try adjusting your search or filters.'
                      : 'Get started by creating a new claim.'}
                  </p>
                  {!hasActiveFilters && (
                    <button
                      onClick={() => setShowNewClaim(true)}
                      className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-body-md font-medium hover:bg-primary-container transition-colors"
                    >
                      <Plus size={16} /> New Claim
                    </button>
                  )}
                </div>
              }
            />

            {/* Pagination footer */}
            <div className="border-t border-surface-border px-4 py-3">
              <Pagination
                page={page}
                limit={limit}
                total={data.count}
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            </div>
          </div>

          <NewClaimModal
            open={showNewClaim}
            onClose={() => setShowNewClaim(false)}
            onCreated={(claim) => {
              setShowNewClaim(false);
              navigate(`/claims/${claim.id}`);
            }}
          />
    </AppLayout>
  );
}
