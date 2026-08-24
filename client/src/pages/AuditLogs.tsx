import { useEffect, useState, type ChangeEvent } from 'react';
import { getAuditLogs } from '../services/audit.service.js';
import { getUsers } from '../services/user.service.js';
import { DataTable, type Column } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { AppLayout } from '../components/AppLayout.jsx';
import { Select } from '../components/Select.jsx';
import { useList } from '../hooks/useList.js';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AuditLogs() {
  const { page, setPage, limit, setLimit, search, applySearch, filters, applyFilters } = useList();
  const [data, setData] = useState<Record<string, unknown>>({ items: [], count: 0 });
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | number | null>(null);

  useEffect(() => {
    getUsers({ limit: 1000 }).then((res) => {
      const response = res as Record<string, unknown>;
      setUsers((response['users'] as Record<string, unknown>[] | undefined) ?? []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    getAuditLogs({
      page,
      limit,
      action: search,
      tableName: (filters['tableName'] as string | undefined) ?? '',
      userId: (filters['userId'] as string | undefined) ?? '',
      from: (filters['from'] as string | undefined) ?? '',
      to: (filters['to'] as string | undefined) ?? '',
    })
      .then((res) => setData(res as Record<string, unknown>))
      .finally(() => setLoading(false));
  }, [page, limit, search, filters, filters.userId, filters.tableName, filters.from, filters.to]);

  const columns: Column[] = [
    {
      key: 'createdAt',
      title: 'Time',
      render: (row) => new Date(row['createdAt'] as string).toLocaleString(),
    },
    { key: 'action', title: 'Action' },
    { key: 'tableName', title: 'Table' },
    {
      key: 'user',
      title: 'User',
      render: (row) => {
        const user = row['user'] as Record<string, unknown> | undefined;
        return user ? `${user['firstName'] as string} ${user['lastName'] as string}` : 'System';
      },
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
          onChange={(e: ChangeEvent<HTMLInputElement>) => applySearch(e.target.value)}
          placeholder="Search action"
          className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
        />
        <Select
          value={(filters['tableName'] as string | undefined) ?? ''}
          onChange={(v) => applyFilters({ ...filters, tableName: v as string })}
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
          value={(filters['userId'] as string | undefined) ?? ''}
          onChange={(v) => applyFilters({ ...filters, userId: v as string })}
          options={[
            { value: '', label: 'All users' },
            ...users.map((u) => ({
              value: u['id'] as string | number,
              label: String(u['fullName'] ?? ''),
            })),
          ]}
          placeholder="All users"
        />
        <input
          type="date"
          value={(filters['from'] as string | undefined) ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => applyFilters({ ...filters, from: e.target.value })}
          className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
        />
        <input
          type="date"
          value={(filters['to'] as string | undefined) ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => applyFilters({ ...filters, to: e.target.value })}
          className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
        />
      </div>

      <DataTable
        columns={columns}
        rows={data['items'] as Record<string, unknown>[]}
        loading={loading}
        keyExtractor={(row) => row['id'] as string | number}
        rowActions={(row) => (
          <button
            onClick={() =>
              setExpanded(expanded === (row['id'] as string | number) ? null : (row['id'] as string | number))
            }
            className="p-1.5 text-outline hover:text-primary hover:bg-surface-container-low rounded"
          >
            {expanded === (row['id'] as string | number) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      />

      {expanded && (
        <div className="mt-4 bg-surface border border-surface-border rounded shadow-sm p-4">
          <h4 className="text-body-md font-semibold text-primary mb-2">Details</h4>
          <pre className="text-body-sm text-on-surface-variant font-mono whitespace-pre-wrap">
            {(() => {
              const items = data['items'] as Record<string, unknown>[];
              const found = items.find((i) => (i['id'] as string | number) === expanded);
              const newValues = found?.['newValues'];
              return JSON.stringify(newValues, null, 2) || '—';
            })()}
          </pre>
        </div>
      )}

      <Pagination
        page={page}
        limit={limit}
        total={data['count'] as number}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </AppLayout>
  );
}
