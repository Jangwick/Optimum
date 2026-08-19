import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DataTable } from './DataTable.jsx';
import { Pagination } from './Pagination.jsx';
import { Modal } from './Modal.jsx';
import { ConfirmDialog } from './ConfirmDialog.jsx';
import { useList } from '../hooks/useList.js';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

export function MasterDataCrud({
  title,
  list,
  create,
  update,
  remove,
  fields,
  columns,
  defaultValues,
  transformIn,
  transformOut,
}) {
  const { page, setPage, limit, setLimit, search, applySearch, sortField, sortOrder, onSort, refresh, reload } = useList();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const schema = z.object(
    fields.reduce((acc, f) => {
      let validator = f.required ? z.string().min(1, 'Required') : z.string().optional();
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
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues });

  useEffect(() => {
    setLoading(true);
    list({ page, limit, search, sortField, sortOrder })
      .then((res) => {
        setItems(res.items || []);
        setCount(res.count || 0);
      })
      .finally(() => setLoading(false));
  }, [list, page, limit, search, sortField, sortOrder, refresh]);

  const openCreate = () => {
    setEditing(null);
    reset(defaultValues);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const values = transformIn ? transformIn(row) : row;
    reset(values);
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    const payload = transformOut ? transformOut(values) : values;
    if (editing) {
      await update(editing.id, payload);
    } else {
      await create(payload);
    }
    setModalOpen(false);
    reload();
  };

  const doDelete = async () => {
    await remove(confirm.id);
    setConfirm(null);
    reload();
  };

  return (
    <div>
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-headline-sm font-semibold text-primary">{title}</h3>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-white px-3 py-2 rounded text-label-md uppercase hover:bg-primary-container"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="bg-surface border border-surface-border rounded shadow-sm p-4 mb-4">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e) => applySearch(e.target.value)}
            placeholder="Search..."
            className="w-full h-10 pl-10 pr-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
          />
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
            render: (row) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => openEdit(row)} className="p-1.5 text-primary hover:bg-surface-container-low rounded">
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirm({ id: row.id, name: row.name || row.policyNumber || row.code })}
                  className="p-1.5 text-error hover:bg-error/10 rounded"
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
        keyExtractor={(row) => row.id}
      />

      <Pagination page={page} limit={limit} total={count} onPageChange={setPage} onLimitChange={setLimit} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${title}` : `Add ${title}`}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-body-sm font-semibold mb-1">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  {...register(f.key)}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="">— Select —</option>
                  {f.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'}
                  step={f.type === 'number' ? '0.01' : undefined}
                  {...register(f.key)}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              )}
              {errors[f.key] && <p className="text-body-sm text-error mt-1">{errors[f.key].message}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded border border-outline text-body-md hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-primary text-white text-body-md hover:bg-primary-container disabled:opacity-50"
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
          title="Delete record"
          message={`Are you sure you want to delete ${confirm.name}?`}
          confirmText="Delete"
          danger
        />
      )}
    </div>
  );
}
