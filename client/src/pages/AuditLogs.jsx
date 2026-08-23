import { useEffect, useState } from 'react';
import { getAuditLogs } from '../services/audit.service.js';
import { getUsers } from '../services/user.service.js';
import { DataTable } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { AppLayout } from '../components/AppLayout.jsx';
import { Select } from '../components/Select.jsx';
import { useList } from '../hooks/useList.js';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AuditLogs() {
  const { page, setPage, limit, setLimit, search, applySearch, filters, applyFilters } = useList();
  const [data, setData] = useState({ items: [], count: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    getUsers({ limit: 1000 }).then((res) => setUsers(res.users || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    getAuditLogs({
      page,
      limit,
      action: search,
      tableName: filters.tableName || '',
      userId: filters.userId || '',
      from: filters.from || '',
      to: filters.to || '',
    })
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [page, limit, search, filters, filters.userId, filters.tableName, filters.from, filters.to]);

  const columns = [
    { key: 'createdAt', title: 'Time', render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: 'action', title: 'Action' },
    { key: 'tableName', title: 'Table' },
    {
      key: 'user',
      title: 'User',
      render: (row) => (row.user ? `${row.user.firstName} ${row.user.lastName}` : 'System'),
    },
    { key: 'recordId', title: 'Record' },
  ];

  return (
    <AppLayout>
          <div className="mb-6">
            <h2 className="text-headline-lg font-semibold text-primary">Audit Logs</h2>
            <p className="text-body-md text-on-surface-variant mt-1">Recent system activity.</p>
          </div>

          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Search action"
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
            <Select
              value={filters.tableName || ''}
              onChange={(v) => applyFilters({ ...filters, tableName: v })}
              options={[
                { value: '', label: 'All tables' },
                { value: 'Claim', label: 'Claim' },
                { value: 'Document', label: 'Document' },
                { value: 'InspectionPhoto', label: 'Inspection Photo' },
                { value: 'Report', label: 'Report' },
                { value: 'Clarification', label: 'Clarification' },
                { value: 'DiscussionNote', label: 'Discussion Note' },
                { value: 'Invoice', label: 'Invoice' },
                { value: 'Payment', label: 'Payment' },
                { value: 'Settlement', label: 'Settlement' },
                { value: 'Offer', label: 'Offer' },
                { value: 'LossAssessment', label: 'Loss Assessment' },
                { value: 'Investigation', label: 'Investigation' },
                { value: 'Fee', label: 'Fee' },
              ]}
              placeholder="All tables"
              ariaLabel="Filter by table"
            />
            <Select
              value={filters.userId || ''}
              onChange={(v) => applyFilters({ ...filters, userId: v })}
              options={[
                { value: '', label: 'All users' },
                ...users.map((u) => ({ value: u.id, label: u.fullName })),
              ]}
              placeholder="All users"
            />
            <input
              type="date"
              value={filters.from || ''}
              onChange={(e) => applyFilters({ ...filters, from: e.target.value })}
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
            <input
              type="date"
              value={filters.to || ''}
              onChange={(e) => applyFilters({ ...filters, to: e.target.value })}
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
          </div>

          <DataTable
            columns={columns}
            rows={data.items}
            loading={loading}
            keyExtractor={(row) => row.id}
            rowActions={(row) => (
              <button
                onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                className="p-1.5 text-outline hover:text-primary hover:bg-surface-container-low rounded"
              >
                {expanded === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          />

          {expanded && (
            <div className="mt-4 bg-surface border border-surface-border rounded shadow-sm p-4">
              <h4 className="text-body-md font-semibold text-primary mb-2">Details</h4>
              <pre className="text-body-sm text-on-surface-variant font-mono whitespace-pre-wrap">
                {JSON.stringify(data.items.find((i) => i.id === expanded)?.newValues, null, 2) || '—'}
              </pre>
            </div>
          )}

          <Pagination page={page} limit={limit} total={data.count} onPageChange={setPage} onLimitChange={setLimit} />
    </AppLayout>
  );
}
