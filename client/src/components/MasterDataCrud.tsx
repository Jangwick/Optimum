import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, type ZodTypeAny } from 'zod';
import { DataTable, type Column } from './DataTable.jsx';
import { Pagination } from './Pagination.jsx';
import { Modal } from './Modal.jsx';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { Select } from './Select.jsx';
import { useList } from '../hooks/useList.js';
import { Plus, Pencil, Trash2, Search, Database, X } from 'lucide-react';

interface MasterDataField {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'number' | 'select' | 'date';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

interface MasterDataCrudProps {
  title: string;
  entityLabel?: string;
  list: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
  create: (payload: Record<string, unknown>) => Promise<unknown>;
  update: (id: number, payload: Record<string, unknown>) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  fields: MasterDataField[];
  columns: Column[];
  defaultValues: Record<string, unknown>;
  transformIn?: (row: Record<string, unknown>) => Record<string, unknown>;
  transformOut?: (values: Record<string, unknown>) => Record<string, unknown>;
  initialSearch?: string;
}

export function MasterDataCrud({
  title,
  entityLabel,
  list,
  create,
  update,
  remove,
  fields,
  columns,
  defaultValues,
  transformIn,
  transformOut,
  initialSearch = '',
}: MasterDataCrudProps) {
  const { page, setPage, limit, setLimit, search, applySearch, sortField, sortOrder, onSort, refresh, reload } = useList({ initialSearch });
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null);

  const schema = z.object(
    fields.reduce<Record<string, ZodTypeAny>>((acc, f) => {
      let validator: ZodTypeAny = f.required ? z.string().min(1, 'Required') : z.string().optional();
      if (f.type === 'email') validator = f.required ? z.string().email() : z.string().email().optional();
      if (f.type === 'number') validator = f.required ? z.coerce.number() : z.coerce.number().optional();
      if (f.type === 'select') validator = f.required ? z.string().min(1) : z.string().optional();
      if (f.type === 'date') validator = f.required ? z.coerce.date() : z.coerce.date().optional();
      acc[f.key] = validator;
      return acc;
    }, {})
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    setLoading(true);
    list({ page, limit, search, sortField, sortOrder })
      .then((res) => {
        const result = res as { items?: Record<string, unknown>[]; count?: number };
        setItems(result.items || []);
        setCount(result.count || 0);
      })
      .finally(() => setLoading(false));
  }, [list, page, limit, search, sortField, sortOrder, refresh]);

  const openCreate = () => {
    setEditing(null);
    reset(defaultValues);
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    const values = transformIn ? transformIn(row) : row;
    reset(values as Record<string, unknown>);
    setModalOpen(true);
  };

  const onSubmit = async (values: Record<string, unknown>) => {
    const payload = transformOut ? transformOut(values) : values;
    if (editing) {
      await update(editing.id as number, payload);
    } else {
      await create(payload);
    }
    setModalOpen(false);
    reload();
  };

  const doDelete = async () => {
    if (!confirm) return;
    await remove(confirm.id);
    setConfirm(null);
    reload();
  };

  const hasActiveFilters = search;

  const fieldRows = fields.reduce<MasterDataField[][]>((acc, f, i) => {
    if (i % 2 === 0) {
      acc.push([f]);
    } else {
      acc[acc.length - 1]?.push(f);
    }
    return acc;
  }, []);

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-headline-sm font-semibold text-primary">{title}</h3>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            {count} {count === 1 ? 'record' : 'records'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-label-md font-medium uppercase hover:bg-primary-container transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add {entityLabel || title}
        </button>
      </div>

      <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 mb-4">
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full h-10 pl-10 pr-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              aria-label={`Search ${title}`}
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => applySearch('')}
              className="h-10 px-3 rounded border border-outline text-body-md text-on-surface-variant hover:bg-surface-container-low transition-colors flex items-center gap-1.5"
              title="Clear search"
            >
              <X size={16} />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      <DataTable
        columns={[
          ...columns,
          {
            key: 'actions',
            title: '',
            sortable: false,
            align: 'right',
            render: (row: Record<string, unknown>) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => openEdit(row)}
                  className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                  title="Edit"
                  aria-label={`Edit ${(row.name || row.policyNumber || row.code) as string}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirm({ id: row.id as number, name: (row.name || row.policyNumber || row.code) as string })}
                  className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded transition-colors"
                  title="Delete"
                  aria-label={`Delete ${(row.name || row.policyNumber || row.code) as string}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          },
        ]}
        rows={items}
        loading={loading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={onSort}
        keyExtractor={(row) => row.id as string | number}
        emptyState={
          <div className="p-12 text-center">
            <Database size={40} className="mx-auto text-outline mb-3" />
            <p className="text-body-md font-medium text-on-surface">No {title.toLowerCase()} found</p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {hasActiveFilters
                ? 'Try adjusting your search.'
                : `Get started by adding your first ${entityLabel ? entityLabel.toLowerCase() : 'record'}.`}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-body-md font-medium hover:bg-primary-container transition-colors"
              >
                <Plus size={16} />
                Add {entityLabel || title}
              </button>
            )}
          </div>
        }
      />

      <Pagination page={page} limit={limit} total={count} onPageChange={setPage} onLimitChange={setLimit} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${entityLabel || title}` : `Add ${entityLabel || title}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fieldRows.map((rowFields, rowIdx) => (
            <div key={rowIdx} className={`grid gap-4 ${rowFields.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {rowFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-body-sm font-semibold mb-1.5">
                    {f.label}
                    {f.required && <span className="text-error ml-0.5">*</span>}
                  </label>
                  {f.type === 'select' ? (
                    <Select
                      value={String(watch(f.key) || '')}
                      onChange={(v) => setValue(f.key, v, { shouldValidate: true })}
                      options={[
                        { value: '', label: '— Select —' },
                        ...(f.options || []).map((o) => ({ value: o.value, label: o.label })),
                      ]}
                      placeholder="— Select —"
                    />
                  ) : (
                    <input
                      type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'}
                      step={f.type === 'number' ? '0.01' : undefined}
                      {...register(f.key)}
                      className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                    />
                  )}
                  {errors[f.key] && <p className="text-body-sm text-error mt-1">{String(errors[f.key]?.message)}</p>}
                </div>
              ))}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-3 border-t border-surface-border">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded border border-outline text-body-md hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-primary text-white text-body-md font-medium hover:bg-primary-container disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={doDelete}
          title={`Delete ${entityLabel || 'record'}`}
          message={`Are you sure you want to delete "${confirm.name}"? This action cannot be undone.`}
          confirmText="Delete"
          danger
        />
      )}
    </div>
  );
}
