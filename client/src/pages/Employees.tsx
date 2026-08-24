import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { getUsers, createUser, updateUser, deactivateUser, activateUser, resetPassword } from '../services/user.service.js';
import { DataTable, type Column } from '../components/DataTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { Modal } from '../components/Modal.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { AppLayout } from '../components/AppLayout.jsx';
import { Select } from '../components/Select.jsx';
import { useList } from '../hooks/useList.js';
import {
  Pencil,
  Power,
  PowerOff,
  KeyRound,
  Plus,
  Search,
  Users,
  Shield,
  Wrench,
  Calculator,
  CircleDot,
  Mail,
  Briefcase,
} from 'lucide-react';

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

type LucideIcon = typeof Shield;

interface RoleConfig {
  label: string;
  icon: LucideIcon;
  badge: string;
  avatar: string;
}

const ROLE_CONFIG: Record<string, RoleConfig> = {
  ADMIN: {
    label: 'Admin',
    icon: Shield,
    badge: 'bg-primary/10 text-primary border-primary/20',
    avatar: 'bg-primary text-white',
  },
  ENGINEER: {
    label: 'Engineer',
    icon: Wrench,
    badge: 'bg-accent-orange/10 text-accent-orange border-accent-orange/20',
    avatar: 'bg-accent-orange text-white',
  },
  ACCOUNTANT: {
    label: 'Accountant',
    icon: Calculator,
    badge: 'bg-success-green/10 text-success-green border-success-green/20',
    avatar: 'bg-success-green text-white',
  },
};

interface UsersData {
  users: Record<string, unknown>[];
  count: number;
}

function initials(firstName: string | undefined, lastName: string | undefined) {
  return `${(firstName ?? '?')[0] ?? ''}${(lastName ?? '?')[0] ?? ''}`.toUpperCase();
}

export default function Employees() {
  const { page, setPage, limit, setLimit, search, applySearch, sortField, sortOrder, onSort, refresh, reload } = useList();

  const [data, setData] = useState<UsersData>({ users: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [confirm, setConfirm] = useState<{ type: 'toggle' | 'reset'; user: Record<string, unknown> } | null>(null);
  const [resetResult, setResetResult] = useState<{ name: string; password: string } | null>(null);
  const [roleFilter, setRoleFilter] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(userSchema) });

  useEffect(() => {
    setLoading(true);
    getUsers({ page, limit, search, sortField, sortOrder, role: roleFilter || undefined })
      .then((res) => setData(res as UsersData))
      .finally(() => setLoading(false));
  }, [page, limit, search, sortField, sortOrder, refresh, roleFilter]);

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

  const openEdit = (user: Record<string, unknown>) => {
    setEditing(user);
    Object.entries(user).forEach(([key, value]) => {
      setValue(key, value);
    });
    setValue('password', '');
    setModalOpen(true);
  };

  const onSubmit = async (values: Record<string, unknown>) => {
    if (editing) {
      await updateUser(editing['id'] as string | number, values);
    } else {
      await createUser(values);
    }
    setModalOpen(false);
    reload();
  };

  const toggleActive = async (user: Record<string, unknown>) => {
    if (user['isActive']) {
      await deactivateUser(user['id'] as string | number);
    } else {
      await activateUser(user['id'] as string | number);
    }
    setConfirm(null);
    reload();
  };

  const doReset = async (user: Record<string, unknown>) => {
    const res = (await resetPassword(user['id'] as string | number)) as Record<string, unknown>;
    setResetResult({
      name: `${(user['firstName'] as string | undefined) ?? ''} ${(user['lastName'] as string | undefined) ?? ''}`.trim(),
      password: res['plainPassword'] as string,
    });
    setConfirm(null);
  };

  const columns: Column[] = [
    {
      key: 'fullName',
      title: 'Name',
      sortable: true,
      render: (row) => {
        const roleCfg = ROLE_CONFIG[(row['role'] as string) ?? 'ENGINEER'] ?? ROLE_CONFIG.ENGINEER!;
        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-label-md font-semibold shrink-0 ${roleCfg.avatar}`}
            >
              {initials(row['firstName'] as string | undefined, row['lastName'] as string | undefined)}
            </div>
            <div className="min-w-0">
              <p className="text-body-md font-medium text-on-surface truncate">{(row['fullName'] as string | undefined) ?? ''}</p>
              {(row['designation'] as string | undefined) && (
                <p className="text-body-sm text-on-surface-variant truncate">{(row['designation'] as string | undefined) ?? ''}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      title: 'Email',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Mail size={14} className="text-outline shrink-0" />
          <span className="text-body-sm truncate">{(row['email'] as string | undefined) ?? ''}</span>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (row) => {
        const roleCfg = ROLE_CONFIG[(row['role'] as string) ?? 'ENGINEER'] ?? ROLE_CONFIG.ENGINEER!;
        const Icon = roleCfg.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium border ${roleCfg.badge}`}
          >
            <Icon size={12} />
            {roleCfg.label}
          </span>
        );
      },
    },
    {
      key: 'employeeNumber',
      title: 'Employee #',
      sortable: true,
      render: (row) => (
        <span className="text-body-sm font-mono text-on-surface-variant">{(row['employeeNumber'] as string | undefined) ?? '—'}</span>
      ),
    },
    {
      key: 'department',
      title: 'Department',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row['department'] ? (
            <>
              <Briefcase size={14} className="text-outline shrink-0" />
              <span className="text-body-sm text-on-surface-variant">{(row['department'] as string | undefined) ?? ''}</span>
            </>
          ) : (
            <span className="text-body-sm text-outline">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (row) => {
        const isActive = !!(row['isActive'] as boolean | undefined);
        return (
          <span className="inline-flex items-center gap-1.5">
            <CircleDot size={14} className={isActive ? 'text-success-green' : 'text-outline'} />
            <span className={`text-body-sm font-medium ${isActive ? 'text-success-green' : 'text-outline'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </span>
        );
      },
    },
  ];

  const rowActions = (row: Record<string, unknown>): ReactNode => {
    const isActive = !!(row['isActive'] as boolean | undefined);
    const fullName = (row['fullName'] as string | undefined) ?? '';
    return (
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => openEdit(row)}
          className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
          title="Edit"
          aria-label={`Edit ${fullName}`}
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => setConfirm({ type: 'toggle', user: row })}
          className={`p-1.5 rounded transition-colors ${
            isActive
              ? 'text-outline hover:text-error hover:bg-error/10'
              : 'text-success-green hover:bg-success-green/10'
          }`}
          title={isActive ? 'Deactivate' : 'Activate'}
          aria-label={`${isActive ? 'Deactivate' : 'Activate'} ${fullName}`}
        >
          {isActive ? <PowerOff size={16} /> : <Power size={16} />}
        </button>
        <button
          onClick={() => setConfirm({ type: 'reset', user: row })}
          className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded transition-colors"
          title="Reset password"
          aria-label={`Reset password for ${fullName}`}
        >
          <KeyRound size={16} />
        </button>
      </div>
    );
  };

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-headline-lg font-semibold text-primary">Employees</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Manage system users, roles, and access.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-label-md font-medium uppercase hover:bg-primary-container transition-colors shadow-sm"
        >
          <Plus size={18} /> New Employee
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: data.count, icon: Users, tint: 'bg-primary/10 text-primary' },
          { label: 'Admins', value: data.users.filter((u) => (u['role'] as string) === 'ADMIN').length, icon: Shield, tint: 'bg-primary/10 text-primary' },
          { label: 'Engineers', value: data.users.filter((u) => (u['role'] as string) === 'ENGINEER').length, icon: Wrench, tint: 'bg-accent-orange/10 text-accent-orange' },
          { label: 'Accountants', value: data.users.filter((u) => (u['role'] as string) === 'ACCOUNTANT').length, icon: Calculator, tint: 'bg-success-green/10 text-success-green' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3"
            >
              <div className={`p-2 rounded flex items-center justify-center shrink-0 ${card.tint}`}>
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-label-md text-outline uppercase truncate">{card.label}</p>
                <p className="text-headline-sm font-semibold text-on-surface tabular-nums">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={search}
            onChange={(e: ChangeEvent<HTMLInputElement>) => applySearch(e.target.value)}
            placeholder="Search name, email, or employee number..."
            className="w-full h-10 pl-10 pr-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            aria-label="Search employees"
          />
        </div>
        <div className="relative">
          <Select
            value={roleFilter}
            onChange={(v) => {
              setRoleFilter(v as string);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'ADMIN', label: 'Admin' },
              { value: 'ENGINEER', label: 'Engineer' },
              { value: 'ACCOUNTANT', label: 'Accountant' },
            ]}
            placeholder="All Roles"
            ariaLabel="Filter by role"
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={data.users}
        loading={loading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={onSort}
        rowActions={rowActions}
        keyExtractor={(row) => (row['id'] as string | number) ?? ''}
        emptyState={
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto text-outline mb-3" />
            <p className="text-body-md font-medium text-on-surface">No employees found</p>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {search || roleFilter
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new employee.'}
            </p>
            {!search && !roleFilter && (
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded text-body-md font-medium hover:bg-primary-container transition-colors"
              >
                <Plus size={16} /> New Employee
              </button>
            )}
          </div>
        }
      />

      <Pagination page={page} limit={limit} total={data.count} onPageChange={setPage} onLimitChange={setLimit} />

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'New Employee'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold mb-1.5">First Name</label>
              <input
                {...register('firstName')}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
              {errors.firstName && <p className="text-body-sm text-error mt-1">{(errors.firstName.message as string | undefined) ?? ''}</p>}
            </div>
            <div>
              <label className="block text-body-sm font-semibold mb-1.5">Last Name</label>
              <input
                {...register('lastName')}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
              {errors.lastName && <p className="text-body-sm text-error mt-1">{(errors.lastName.message as string | undefined) ?? ''}</p>}
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            {errors.email && <p className="text-body-sm text-error mt-1">{(errors.email.message as string | undefined) ?? ''}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold mb-1.5">Role</label>
              <Select
                value={watch('role') as string}
                onChange={(v) => setValue('role', v as 'ADMIN' | 'ENGINEER' | 'ACCOUNTANT', { shouldValidate: true })}
                options={[
                  { value: 'ADMIN', label: 'Admin' },
                  { value: 'ENGINEER', label: 'Engineer' },
                  { value: 'ACCOUNTANT', label: 'Accountant' },
                ]}
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold mb-1.5">Employee #</label>
              <input
                {...register('employeeNumber')}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold mb-1.5">Department</label>
              <input
                {...register('department')}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold mb-1.5">Designation</label>
              <input
                {...register('designation')}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">
              Password {editing && '(leave blank to keep current)'}
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
            {!editing && (
              <p className="text-body-sm text-on-surface-variant mt-1">Leave blank to auto-generate a random password.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-surface-border">
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

      {/* Confirm Dialogs */}
      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={() => (confirm.type === 'toggle' ? toggleActive(confirm.user) : doReset(confirm.user))}
          title={confirm.type === 'toggle' ? ((confirm.user['isActive'] as boolean | undefined) ? 'Deactivate' : 'Activate') : 'Reset Password'}
          message={
            confirm.type === 'toggle'
              ? `Are you sure you want to ${(confirm.user['isActive'] as boolean | undefined) ? 'deactivate' : 'activate'} ${(confirm.user['fullName'] as string | undefined) ?? ''}?`
              : `Reset password for ${(confirm.user['fullName'] as string | undefined) ?? ''}? A new random password will be generated.`
          }
          confirmText={confirm.type === 'toggle' ? ((confirm.user['isActive'] as boolean | undefined) ? 'Deactivate' : 'Activate') : 'Reset'}
          danger={confirm.type === 'toggle' && !!(confirm.user['isActive'] as boolean | undefined)}
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
    </AppLayout>
  );
}
