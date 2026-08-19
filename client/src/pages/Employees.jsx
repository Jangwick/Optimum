import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getUsers, createUser, updateUser, deactivateUser, activateUser, resetPassword } from '../services/user.service.js';
import { DataTable } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { useList } from '../hooks/useList.js';
import { Pencil, Power, PowerOff, KeyRound, Plus, Search } from 'lucide-react';

const userSchema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'ENGINEER', 'ACCOUNTANT']),
    employeeNumber: z.string().optional(),
    department: z.string().optional(),
    designation: z.string().optional(),
    password: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough();

export default function Employees() {
  const { page, setPage, limit, setLimit, search, applySearch, sortField, sortOrder, onSort, refresh, reload } = useList();

  const [data, setData] = useState({ users: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [resetResult, setResetResult] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(userSchema) });

  useEffect(() => {
    setLoading(true);
    getUsers({ page, limit, search, sortField, sortOrder })
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [page, limit, search, sortField, sortOrder, refresh]);

  const openCreate = () => {
    setEditing(null);
    reset({
      firstName: '',
      lastName: '',
      email: '',
      role: 'ENGINEER',
      employeeNumber: '',
      department: '',
      designation: '',
      password: '',
    });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    Object.entries(user).forEach(([key, value]) => setValue(key, value));
    setValue('password', '');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    if (editing) {
      await updateUser(editing.id, values);
    } else {
      await createUser(values);
    }
    setModalOpen(false);
    reload();
  };

  const toggleActive = async (user) => {
    if (user.isActive) {
      await deactivateUser(user.id);
    } else {
      await activateUser(user.id);
    }
    setConfirm(null);
    reload();
  };

  const doReset = async (user) => {
    const res = await resetPassword(user.id);
    setResetResult({ name: `${user.firstName} ${user.lastName}`, password: res.plainPassword });
    setConfirm(null);
  };

  const columns = [
    { key: 'fullName', title: 'Name', sortable: true },
    { key: 'email', title: 'Email', sortable: true },
    { key: 'role', title: 'Role', sortable: true },
    { key: 'employeeNumber', title: 'Employee #', sortable: true },
    { key: 'isActive', title: 'Active', render: (row) => (row.isActive ? 'Yes' : 'No') },
  ];

  const rowActions = (row) => (
    <div className="flex items-center justify-end gap-2">
      <button onClick={() => openEdit(row)} className="p-1.5 text-primary hover:bg-surface-container-low rounded" title="Edit">
        <Pencil size={16} />
      </button>
      <button
        onClick={() => setConfirm({ type: 'toggle', user: row })}
        className="p-1.5 text-outline hover:text-primary hover:bg-surface-container-low rounded"
        title={row.isActive ? 'Deactivate' : 'Activate'}
      >
        {row.isActive ? <PowerOff size={16} /> : <Power size={16} />}
      </button>
      <button
        onClick={() => setConfirm({ type: 'reset', user: row })}
        className="p-1.5 text-outline hover:text-primary hover:bg-surface-container-low rounded"
        title="Reset password"
      >
        <KeyRound size={16} />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">Employees</h2>
              <p className="text-body-md text-on-surface-variant mt-1">System users and roles.</p>
            </div>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-label-md uppercase hover:bg-primary-container transition-colors"
            >
              <Plus size={18} /> New Employee
            </button>
          </div>

          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 mb-6 flex gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={search}
                onChange={(e) => applySearch(e.target.value)}
                placeholder="Search name, email, or employee number"
                className="w-full h-10 pl-10 pr-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            rows={data.users}
            loading={loading}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={onSort}
            rowActions={rowActions}
            keyExtractor={(row) => row.id}
          />

          <Pagination page={page} limit={limit} total={data.count} onPageChange={setPage} onLimitChange={setLimit} />

          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'New Employee'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-semibold mb-1">First Name</label>
                  <input
                    {...register('firstName')}
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  />
                  {errors.firstName && <p className="text-body-sm text-error mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-body-sm font-semibold mb-1">Last Name</label>
                  <input
                    {...register('lastName')}
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  />
                  {errors.lastName && <p className="text-body-sm text-error mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
                {errors.email && <p className="text-body-sm text-error mt-1">{errors.email.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-semibold mb-1">Role</label>
                  <select
                    {...register('role')}
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="ENGINEER">Engineer</option>
                    <option value="ACCOUNTANT">Accountant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-body-sm font-semibold mb-1">Employee #</label>
                  <input
                    {...register('employeeNumber')}
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-body-sm font-semibold mb-1">Department</label>
                  <input
                    {...register('department')}
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-semibold mb-1">Designation</label>
                  <input
                    {...register('designation')}
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1">Password {editing && '(leave blank to keep)'}</label>
                <input
                  type="password"
                  {...register('password')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
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
              onConfirm={() => (confirm.type === 'toggle' ? toggleActive(confirm.user) : doReset(confirm.user))}
              title={confirm.type === 'toggle' ? (confirm.user.isActive ? 'Deactivate' : 'Activate') : 'Reset Password'}
              message={
                confirm.type === 'toggle'
                  ? `Are you sure you want to ${confirm.user.isActive ? 'deactivate' : 'activate'} ${confirm.user.fullName}?`
                  : `Reset password for ${confirm.user.fullName}? A new random password will be generated.`
              }
              confirmText={confirm.type === 'toggle' ? (confirm.user.isActive ? 'Deactivate' : 'Activate') : 'Reset'}
              danger={confirm.type === 'toggle' && confirm.user.isActive}
            />
          )}

          {resetResult && (
            <ConfirmDialog
              open={!!resetResult}
              onClose={() => setResetResult(null)}
              onConfirm={() => setResetResult(null)}
              title="Password Reset"
              message={`New password for ${resetResult.name}: ${resetResult.password}`}
              confirmText="Close"
            />
          )}
        </main>
      </div>
    </div>
  );
}
