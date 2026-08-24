import { useEffect, useState, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { getFees, createFee, getInvoices, createInvoice, recordPayment } from '../services/fee.service.js';
import { getUsers } from '../services/user.service.js';
import { formatCurrency } from '../utils/currency.js';
import { Select } from './Select.jsx';
import { Wallet, FileText, Plus, CheckCircle, DollarSign, AlertTriangle, Receipt, type LucideIcon } from 'lucide-react';

const FEE_TYPES = ['INSPECTION', 'INVESTIGATION', 'ASSESSMENT', 'REPORT', 'TRAVEL', 'CONSULTATION', 'OTHER'];

interface StatusColors {
  bg: string;
  text: string;
  dot: string;
}

const INVOICE_STATUS_COLORS: Record<string, StatusColors> = {
  ISSUED: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  PARTIAL: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  PAID: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  OVERDUE: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
};

interface StatusPillProps {
  status: string;
}

function StatusPill({ status }: StatusPillProps) {
  const colors = INVOICE_STATUS_COLORS[status] ?? {
    bg: 'bg-surface-container-high',
    text: 'text-on-surface-variant',
    dot: 'bg-outline',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
      {status}
    </span>
  );
}

interface TabItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface FeeForm {
  feeType: string;
  amount: string;
  description: string;
  userId: string | number;
}

interface InvoiceForm {
  feeIds: (string | number)[];
  dueDate: string;
  notes: string;
}

interface PaymentForm {
  amount?: string;
  paymentDate?: string;
  method?: string;
  reference?: string;
}

interface ClaimFinanceProps {
  claimId: string | number;
  onClaimChange?: () => void;
}

export default function ClaimFinance({ claimId, onClaimChange }: ClaimFinanceProps) {
  const [tab, setTab] = useState<string>('fees');
  const [fees, setFees] = useState<Record<string, unknown>[]>([]);
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [refresh, setRefresh] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, inv, u] = await Promise.all([
        getFees(claimId),
        getInvoices(claimId),
        getUsers().catch(() => ({ users: [] })),
      ]);
      const feeData = f as Record<string, unknown>;
      const invData = inv as Record<string, unknown>;
      const userData = u as Record<string, unknown>;
      setFees((feeData.items as Record<string, unknown>[] | undefined) ?? []);
      setInvoices((invData.items as Record<string, unknown>[] | undefined) ?? []);
      setUsers((userData.users as Record<string, unknown>[] | undefined) ?? []);
    } catch {
      setError('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, refresh, load]);

  const [feeForm, setFeeForm] = useState<FeeForm>({
    feeType: 'INSPECTION',
    amount: '',
    description: '',
    userId: '',
  });
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>({ feeIds: [], dueDate: '', notes: '' });
  const [payment, setPayment] = useState<Record<string, PaymentForm | undefined>>({});

  const saveFee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createFee(claimId, feeForm as unknown as Record<string, unknown>);
      setFeeForm({ feeType: 'INSPECTION', amount: '', description: '', userId: '' });
      setRefresh((r) => r + 1);
      onClaimChange?.();
    } catch {
      setError('Failed to create fee');
    } finally {
      setSaving(false);
    }
  };

  const saveInvoice = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (invoiceForm.feeIds.length === 0) {
      setError('Select at least one fee to invoice');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createInvoice(claimId, invoiceForm as unknown as Record<string, unknown>);
      setInvoiceForm({ feeIds: [], dueDate: '', notes: '' });
      setRefresh((r) => r + 1);
      onClaimChange?.();
    } catch {
      setError('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const payInvoice = async (invoiceId: string | number) => {
    const p = payment[invoiceId as string];
    if (!p?.amount) return;
    setSaving(true);
    setError(null);
    try {
      await recordPayment(claimId, invoiceId, p as unknown as Record<string, unknown>);
      setPayment({ ...payment, [invoiceId as string]: {} as PaymentForm });
      setRefresh((r) => r + 1);
      onClaimChange?.();
    } catch {
      setError('Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const toggleFee = (id: string | number) => {
    const next = new Set(invoiceForm.feeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setInvoiceForm({ ...invoiceForm, feeIds: Array.from(next) });
  };

  const unbilledFees = fees.filter((f) => !(f.isInvoiced as boolean | undefined));
  const totalFees = fees.reduce(
    (sum, f) => sum + Number((f.amount as number | string | undefined) ?? 0),
    0,
  );
  const totalInvoiced = invoices.reduce(
    (sum, inv) => sum + Number((inv.totalAmount as number | string | undefined) ?? 0),
    0,
  );
  const totalPaid = invoices.reduce((sum, inv) => {
    const paid = ((inv.payments as Record<string, unknown>[] | undefined) ?? []).reduce(
      (s, p) => s + Number((p.amount as number | string | undefined) ?? 0),
      0,
    );
    return sum + paid;
  }, 0);

  const selectedTotal = invoiceForm.feeIds.reduce<number>((sum, id) => {
    const found = fees.find((f) => (f.id as string | number) === id);
    return sum + Number((found?.amount as number | string | undefined) ?? 0);
  }, 0);

  const tabs: TabItem[] = [
    { key: 'fees', label: 'Fees', icon: Wallet },
    { key: 'invoices', label: 'Invoices', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-body-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Wallet size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Total Fees</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono">{formatCurrency(totalFees)}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Invoiced</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono">{formatCurrency(totalInvoiced)}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Collected</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-body-md font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Fees Tab */}
      {tab === 'fees' && (
        <div className="space-y-6">
          <form onSubmit={saveFee} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Add Fee</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Fee Type</label>
                <Select
                  value={feeForm.feeType}
                  onChange={(v) => setFeeForm({ ...feeForm, feeType: v as string })}
                  options={FEE_TYPES.map((t) => ({ value: t, label: t }))}
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={feeForm.amount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFeeForm({ ...feeForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Description</label>
              <input
                type="text"
                value={feeForm.description}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFeeForm({ ...feeForm, description: e.target.value })}
                placeholder="Fee description..."
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Linked User</label>
              <Select
                value={feeForm.userId}
                onChange={(v) => setFeeForm({ ...feeForm, userId: v as string | number })}
                options={[
                  { value: '', label: users.length === 0 ? 'No users available' : 'Select user' },
                  ...users.map((u) => ({
                    value: u.id as string | number,
                    label: (u.fullName as string | undefined) ?? '',
                  })),
                ]}
                placeholder={users.length === 0 ? 'No users available' : 'Select user'}
                disabled={users.length === 0}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {saving ? 'Adding...' : 'Add Fee'}
            </button>
          </form>

          {/* Fee list */}
          {loading ? (
            <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
              <p className="text-body-md text-on-surface-variant">Loading fees...</p>
            </div>
          ) : fees.length === 0 ? (
            <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
              <Wallet size={32} className="text-outline mx-auto mb-2" />
              <p className="text-body-md text-on-surface-variant">No fees recorded yet.</p>
              <p className="text-body-sm text-outline mt-1">Use the form above to add one.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fees.map((f) => {
                const user = f.user as Record<string, unknown> | undefined;
                return (
                  <div key={f.id as string | number} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Wallet size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-md font-semibold text-on-surface">{f.feeType as string | undefined}</p>
                          {!!user && (
                            <p className="text-label-sm text-on-surface-variant">
                              {user.firstName as string | undefined} {user.lastName as string | undefined}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="font-mono text-headline-sm font-semibold text-primary">{formatCurrency(f.amount as number | string | undefined)}</p>
                        {Boolean(f.isInvoiced as boolean | undefined) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-medium bg-primary/10 text-primary">
                            <CheckCircle size={10} />
                            Invoiced
                          </span>
                        )}
                      </div>
                    </div>
                    {!!(f.description as string | undefined) && (
                      <div className="p-3">
                        <span className="text-label-md text-outline uppercase">Description</span>
                        <p className="text-body-sm text-on-surface mt-0.5">{f.description as string}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {tab === 'invoices' && (
        <div className="space-y-6">
          <form onSubmit={saveInvoice} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Generate Invoice</h3>
            </div>
            <div>
              <span className="text-label-md text-outline uppercase font-medium">Select Unbilled Fees</span>
              {unbilledFees.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant mt-2 p-3 bg-surface-container-low rounded-lg">
                  No unbilled fees available. Add fees first before generating an invoice.
                </p>
              ) : (
                <div className="mt-2 space-y-1">
                  {unbilledFees.map((f) => (
                    <label
                      key={f.id as string | number}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={invoiceForm.feeIds.includes(f.id as string | number)}
                        onChange={() => toggleFee(f.id as string | number)}
                        className="rounded border-outline"
                      />
                      <span className="text-body-sm text-on-surface flex-1">{f.feeType as string | undefined}</span>
                      {!!(f.description as string | undefined) && <span className="text-body-sm text-on-surface-variant truncate">— {f.description as string}</span>}
                      <span className="font-mono text-body-sm font-medium text-primary">{formatCurrency(f.amount as number | string | undefined)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {invoiceForm.feeIds.length > 0 && (
              <p className="text-body-md font-mono font-semibold text-primary">
                Selected Total: {formatCurrency(selectedTotal)}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
                <input
                  type="text"
                  value={invoiceForm.notes}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  placeholder="Invoice notes..."
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving || unbilledFees.length === 0}
              className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {saving ? 'Generating...' : 'Generate Invoice'}
            </button>
          </form>

          {/* Invoice list */}
          {loading ? (
            <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
              <p className="text-body-md text-on-surface-variant">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
              <FileText size={32} className="text-outline mx-auto mb-2" />
              <p className="text-body-md text-on-surface-variant">No invoices generated yet.</p>
              <p className="text-body-sm text-outline mt-1">Add fees first, then generate an invoice.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => {
                const paymentsArray = (inv.payments as Record<string, unknown>[] | undefined) ?? [];
                const paid = paymentsArray.reduce(
                  (s, p) => s + Number((p.amount as number | string | undefined) ?? 0),
                  0,
                );
                const balance = Number((inv.totalAmount as number | string | undefined) ?? 0) - paid;
                const feesArray = (inv.fees as Record<string, unknown>[] | undefined) ?? [];
                const createdBy = inv.createdBy as Record<string, unknown> | undefined;
                return (
                  <div key={inv.id as string | number} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-surface-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Receipt size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-md font-semibold text-on-surface font-mono">{inv.invoiceNumber as string | undefined}</p>
                          <p className="text-label-sm text-outline font-mono mt-0.5">
                            Issued: {new Date(inv.issueDate as string).toLocaleDateString()}
                            {!!(inv.dueDate as string | undefined) && ` · Due: ${new Date(inv.dueDate as string).toLocaleDateString()}`}
                            {!!createdBy && ` · ${createdBy.firstName as string | undefined} ${createdBy.lastName as string | undefined}`}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={inv.status as string} />
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-3">
                      {!!(inv.notes as string | undefined) && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Notes</span>
                          <p className="text-body-sm text-on-surface mt-0.5">{inv.notes as string}</p>
                        </div>
                      )}

                      {/* Line items (fees) */}
                      {feesArray.length > 0 && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Fees</span>
                          <ul className="mt-1 divide-y divide-surface-border text-body-sm">
                            {feesArray.map((f) => (
                              <li key={f.id as string | number} className="py-2 flex justify-between items-center gap-3">
                                <span className="text-on-surface truncate">{f.feeType as string | undefined}</span>
                                <span className="font-mono text-on-surface font-medium whitespace-nowrap">{formatCurrency(f.amount as number | string | undefined)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Payment summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-surface-border">
                        <div>
                          <span className="text-label-md text-outline uppercase">Total</span>
                          <p className="font-mono text-body-md font-semibold text-on-surface">{formatCurrency(inv.totalAmount as number | string | undefined)}</p>
                        </div>
                        <div>
                          <span className="text-label-md text-outline uppercase">Paid</span>
                          <p className="font-mono text-body-md font-semibold text-success">{formatCurrency(paid)}</p>
                        </div>
                        <div>
                          <span className="text-label-md text-outline uppercase">Balance</span>
                          <p className="font-mono text-body-md font-semibold text-accent-orange">{formatCurrency(balance)}</p>
                        </div>
                      </div>

                      {/* Payment history */}
                      {paymentsArray.length > 0 && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Payment History</span>
                          <ul className="mt-1 divide-y divide-surface-border text-body-sm">
                            {paymentsArray.map((p) => (
                              <li key={p.id as string | number} className="py-2 flex justify-between items-center gap-3">
                                <div className="min-w-0">
                                  <span className="text-on-surface font-mono">{formatCurrency(p.amount as number | string | undefined)}</span>
                                  <span className="text-on-surface-variant ml-2">
                                    {new Date(p.paymentDate as string).toLocaleDateString()}
                                    {!!(p.method as string | undefined) && ` · ${p.method as string}`}
                                    {!!(p.reference as string | undefined) && ` · ${p.reference as string}`}
                                  </span>
                                </div>
                                <CheckCircle size={14} className="text-success shrink-0" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Record payment form */}
                      {inv.status !== 'PAID' && (
                        <div className="pt-3 border-t border-surface-border space-y-2">
                          <span className="text-label-md text-outline uppercase font-medium">Record Payment</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={balance}
                              value={payment[inv.id as string]?.amount || ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const existing = payment[inv.id as string] ?? ({} as PaymentForm);
                                setPayment({ ...payment, [inv.id as string]: { ...existing, amount: e.target.value } });
                              }}
                              placeholder="Amount"
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                            <input
                              type="date"
                              value={payment[inv.id as string]?.paymentDate || ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const existing = payment[inv.id as string] ?? ({} as PaymentForm);
                                setPayment({ ...payment, [inv.id as string]: { ...existing, paymentDate: e.target.value } });
                              }}
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                            <input
                              type="text"
                              value={payment[inv.id as string]?.method || ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const existing = payment[inv.id as string] ?? ({} as PaymentForm);
                                setPayment({ ...payment, [inv.id as string]: { ...existing, method: e.target.value } });
                              }}
                              placeholder="Method"
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                            <input
                              type="text"
                              value={payment[inv.id as string]?.reference || ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const existing = payment[inv.id as string] ?? ({} as PaymentForm);
                                setPayment({ ...payment, [inv.id as string]: { ...existing, reference: e.target.value } });
                              }}
                              placeholder="Reference"
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                          </div>
                          <button
                            onClick={() => payInvoice(inv.id as string | number)}
                            disabled={saving || !payment[inv.id as string]?.amount}
                            className="h-10 px-4 bg-success text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <DollarSign size={16} />
                            Record Payment
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
