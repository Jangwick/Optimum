import { useEffect, useState, useCallback } from 'react';
import { getFees, createFee, getInvoices, createInvoice, recordPayment } from '../services/fee.service.js';
import { getUsers } from '../services/user.service.js';
import { formatCurrency } from '../utils/currency.js';
import { Select } from './Select.jsx';
import { Wallet, FileText, Plus, CheckCircle, DollarSign, AlertTriangle, Receipt } from 'lucide-react';

const FEE_TYPES = ['INSPECTION', 'INVESTIGATION', 'ASSESSMENT', 'REPORT', 'TRAVEL', 'CONSULTATION', 'OTHER'];

const INVOICE_STATUS_COLORS = {
  ISSUED: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  PARTIAL: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  PAID: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  OVERDUE: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
};

function StatusPill({ status }) {
  const colors = INVOICE_STATUS_COLORS[status] || { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium whitespace-nowrap ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
      {status}
    </span>
  );
}

export default function ClaimFinance({ claimId, onClaimChange }) {
  const [tab, setTab] = useState('fees');
  const [fees, setFees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, inv, u] = await Promise.all([
        getFees(claimId),
        getInvoices(claimId),
        getUsers().catch(() => ({ users: [] })),
      ]);
      setFees(f.items || []);
      setInvoices(inv.items || []);
      setUsers(u.users || []);
    } catch {
      setError('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, refresh, load]);

  const [feeForm, setFeeForm] = useState({ feeType: 'INSPECTION', amount: '', description: '', userId: '' });
  const [invoiceForm, setInvoiceForm] = useState({ feeIds: [], dueDate: '', notes: '' });
  const [payment, setPayment] = useState({});

  const saveFee = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createFee(claimId, feeForm);
      setFeeForm({ feeType: 'INSPECTION', amount: '', description: '', userId: '' });
      setRefresh((r) => r + 1);
      onClaimChange?.();
    } catch {
      setError('Failed to create fee');
    } finally {
      setSaving(false);
    }
  };

  const saveInvoice = async (e) => {
    e.preventDefault();
    if (invoiceForm.feeIds.length === 0) {
      setError('Select at least one fee to invoice');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createInvoice(claimId, invoiceForm);
      setInvoiceForm({ feeIds: [], dueDate: '', notes: '' });
      setRefresh((r) => r + 1);
      onClaimChange?.();
    } catch {
      setError('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const payInvoice = async (invoiceId) => {
    const p = payment[invoiceId];
    if (!p?.amount) return;
    setSaving(true);
    setError(null);
    try {
      await recordPayment(claimId, invoiceId, p);
      setPayment({ ...payment, [invoiceId]: {} });
      setRefresh((r) => r + 1);
      onClaimChange?.();
    } catch {
      setError('Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const toggleFee = (id) => {
    const next = new Set(invoiceForm.feeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setInvoiceForm({ ...invoiceForm, feeIds: Array.from(next) });
  };

  const unbilledFees = fees.filter((f) => !f.isInvoiced);
  const totalFees = fees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => {
    const paid = (inv.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
    return sum + paid;
  }, 0);

  const tabs = [
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
                  onChange={(v) => setFeeForm({ ...feeForm, feeType: v })}
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
                  onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
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
                onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                placeholder="Fee description..."
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Linked User</label>
              <Select
                value={feeForm.userId}
                onChange={(v) => setFeeForm({ ...feeForm, userId: v })}
                options={[
                  { value: '', label: users.length === 0 ? 'No users available' : 'Select user' },
                  ...users.map((u) => ({ value: u.id, label: u.fullName })),
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
              {fees.map((f) => (
                <div key={f.id} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Wallet size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-md font-semibold text-on-surface">{f.feeType}</p>
                        {f.user && (
                          <p className="text-label-sm text-on-surface-variant">
                            {f.user.firstName} {f.user.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <p className="font-mono text-headline-sm font-semibold text-primary">{formatCurrency(f.amount)}</p>
                      {f.isInvoiced && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-medium bg-primary/10 text-primary">
                          <CheckCircle size={10} />
                          Invoiced
                        </span>
                      )}
                    </div>
                  </div>
                  {f.description && (
                    <div className="p-3">
                      <span className="text-label-md text-outline uppercase">Description</span>
                      <p className="text-body-sm text-on-surface mt-0.5">{f.description}</p>
                    </div>
                  )}
                </div>
              ))}
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
                      key={f.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={invoiceForm.feeIds.includes(f.id)}
                        onChange={() => toggleFee(f.id)}
                        className="rounded border-outline"
                      />
                      <span className="text-body-sm text-on-surface flex-1">{f.feeType}</span>
                      {f.description && <span className="text-body-sm text-on-surface-variant truncate">— {f.description}</span>}
                      <span className="font-mono text-body-sm font-medium text-primary">{formatCurrency(f.amount)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {invoiceForm.feeIds.length > 0 && (
              <p className="text-body-md font-mono font-semibold text-primary">
                Selected Total: {formatCurrency(
                  invoiceForm.feeIds.reduce((sum, id) => sum + Number(fees.find((f) => f.id === id)?.amount || 0), 0)
                )}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
                <input
                  type="text"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
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
                const paid = (inv.payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
                const balance = Number(inv.totalAmount || 0) - paid;
                return (
                  <div key={inv.id} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-surface-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Receipt size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-md font-semibold text-on-surface font-mono">{inv.invoiceNumber}</p>
                          <p className="text-label-sm text-outline font-mono mt-0.5">
                            Issued: {new Date(inv.issueDate).toLocaleDateString()}
                            {inv.dueDate && ` · Due: ${new Date(inv.dueDate).toLocaleDateString()}`}
                            {inv.createdBy && ` · ${inv.createdBy.firstName} ${inv.createdBy.lastName}`}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={inv.status} />
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-3">
                      {inv.notes && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Notes</span>
                          <p className="text-body-sm text-on-surface mt-0.5">{inv.notes}</p>
                        </div>
                      )}

                      {/* Line items (fees) */}
                      {inv.fees?.length > 0 && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Fees</span>
                          <ul className="mt-1 divide-y divide-surface-border text-body-sm">
                            {inv.fees.map((f) => (
                              <li key={f.id} className="py-2 flex justify-between items-center gap-3">
                                <span className="text-on-surface truncate">{f.feeType}</span>
                                <span className="font-mono text-on-surface font-medium whitespace-nowrap">{formatCurrency(f.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Payment summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-surface-border">
                        <div>
                          <span className="text-label-md text-outline uppercase">Total</span>
                          <p className="font-mono text-body-md font-semibold text-on-surface">{formatCurrency(inv.totalAmount)}</p>
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
                      {inv.payments?.length > 0 && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Payment History</span>
                          <ul className="mt-1 divide-y divide-surface-border text-body-sm">
                            {inv.payments.map((p) => (
                              <li key={p.id} className="py-2 flex justify-between items-center gap-3">
                                <div className="min-w-0">
                                  <span className="text-on-surface font-mono">{formatCurrency(p.amount)}</span>
                                  <span className="text-on-surface-variant ml-2">
                                    {new Date(p.paymentDate).toLocaleDateString()}
                                    {p.method && ` · ${p.method}`}
                                    {p.reference && ` · ${p.reference}`}
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
                              value={payment[inv.id]?.amount || ''}
                              onChange={(e) => setPayment({ ...payment, [inv.id]: { ...payment[inv.id], amount: e.target.value } })}
                              placeholder="Amount"
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                            <input
                              type="date"
                              value={payment[inv.id]?.paymentDate || ''}
                              onChange={(e) => setPayment({ ...payment, [inv.id]: { ...payment[inv.id], paymentDate: e.target.value } })}
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                            <input
                              type="text"
                              value={payment[inv.id]?.method || ''}
                              onChange={(e) => setPayment({ ...payment, [inv.id]: { ...payment[inv.id], method: e.target.value } })}
                              placeholder="Method"
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                            <input
                              type="text"
                              value={payment[inv.id]?.reference || ''}
                              onChange={(e) => setPayment({ ...payment, [inv.id]: { ...payment[inv.id], reference: e.target.value } })}
                              placeholder="Reference"
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                          </div>
                          <button
                            onClick={() => payInvoice(inv.id)}
                            disabled={saving || !payment[inv.id]?.amount}
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
