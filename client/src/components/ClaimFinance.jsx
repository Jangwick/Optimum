import { useEffect, useState } from 'react';
import { getFees, createFee, getInvoices, createInvoice, recordPayment } from '../services/fee.service.js';
import { getUsers } from '../services/user.service.js';

export default function ClaimFinance({ claimId }) {
  const [tab, setTab] = useState('fees');
  const [fees, setFees] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [users, setUsers] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const load = async () => {
    const [f, inv, u] = await Promise.all([getFees(claimId), getInvoices(claimId), getUsers()]);
    setFees(f.items || []);
    setInvoices(inv.items || []);
    setUsers(u.users || []);
  };

  useEffect(() => {
    load();
  }, [claimId, refresh]);

  const [feeForm, setFeeForm] = useState({ feeType: 'INSPECTION', amount: '', description: '', userId: '' });
  const [invoiceForm, setInvoiceForm] = useState({ feeIds: [], dueDate: '', notes: '' });
  const [payment, setPayment] = useState({});

  const saveFee = async (e) => {
    e.preventDefault();
    await createFee(claimId, feeForm);
    setFeeForm({ feeType: 'INSPECTION', amount: '', description: '', userId: '' });
    setRefresh((r) => r + 1);
  };

  const saveInvoice = async (e) => {
    e.preventDefault();
    await createInvoice(claimId, invoiceForm);
    setInvoiceForm({ feeIds: [], dueDate: '', notes: '' });
    setRefresh((r) => r + 1);
  };

  const payInvoice = async (invoiceId) => {
    const p = payment[invoiceId];
    if (!p?.amount) return;
    await recordPayment(claimId, invoiceId, p);
    setPayment({ ...payment, [invoiceId]: {} });
    setRefresh((r) => r + 1);
  };

  const toggleFee = (id) => {
    const next = new Set(invoiceForm.feeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setInvoiceForm({ ...invoiceForm, feeIds: Array.from(next) });
  };

  const tabs = [
    { key: 'fees', label: 'Fees' },
    { key: 'invoices', label: 'Invoices' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-surface-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-body-md font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fees' && (
        <div className="space-y-6">
          <form onSubmit={saveFee} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
            <h3 className="text-headline-sm font-semibold text-primary">Add Fee</h3>
            <input type="text" value={feeForm.feeType} onChange={(e) => setFeeForm({ ...feeForm, feeType: e.target.value })} placeholder="Fee type" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" required />
            <input type="number" step="0.01" value={feeForm.amount} onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })} placeholder="Amount" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" required />
            <input type="text" value={feeForm.description} onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })} placeholder="Description" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <select value={feeForm.userId} onChange={(e) => setFeeForm({ ...feeForm, userId: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" required>
              <option value="">Linked user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Add Fee</button>
          </form>
          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
            {fees.map((f) => (
              <div key={f.id} className="p-3 bg-surface-container-low rounded flex justify-between">
                <div>
                  <p className="text-body-md font-semibold">{f.feeType}</p>
                  <p className="text-body-sm text-on-surface-variant">{f.description} · {f.user?.firstName} {f.user?.lastName}</p>
                </div>
                <p className="font-mono text-body-lg font-semibold">${f.amount}</p>
              </div>
            ))}
            {fees.length === 0 && <p className="text-body-md text-on-surface-variant">No fees recorded.</p>}
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="space-y-6">
          <form onSubmit={saveInvoice} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
            <h3 className="text-headline-sm font-semibold text-primary">Generate Invoice</h3>
            <p className="text-body-sm text-on-surface-variant">Select unbilled fees:</p>
            {fees.filter((f) => !f.isInvoiced).map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-body-md">
                <input type="checkbox" checked={invoiceForm.feeIds.includes(f.id)} onChange={() => toggleFee(f.id)} />
                {f.feeType} — ${f.amount}
              </label>
            ))}
            <input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <input type="text" value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} placeholder="Notes" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Generate Invoice</button>
          </form>

          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-3 bg-surface-container-low rounded">
                <div className="flex justify-between items-center">
                  <p className="text-body-md font-semibold">{inv.invoiceNumber}</p>
                  <span className="px-2 py-0.5 rounded text-label-md font-medium" style={{ background: inv.status === 'PAID' ? '#e8f5e9' : '#fff3e0', color: inv.status === 'PAID' ? '#28a745' : '#f26522' }}>{inv.status}</span>
                </div>
                <p className="text-body-sm text-on-surface-variant">{new Date(inv.issueDate).toLocaleDateString()} · Total: ${inv.totalAmount}</p>
                <p className="text-body-md mt-1">{inv.notes}</p>
                {inv.status !== 'PAID' && (
                  <div className="mt-3 flex gap-2">
                    <input type="number" step="0.01" value={payment[inv.id]?.amount || ''} onChange={(e) => setPayment({ ...payment, [inv.id]: { ...payment[inv.id], amount: e.target.value } })} placeholder="Amount" className="h-10 px-3 rounded border border-outline bg-surface text-body-md" />
                    <input type="date" value={payment[inv.id]?.paymentDate || ''} onChange={(e) => setPayment({ ...payment, [inv.id]: { ...payment[inv.id], paymentDate: e.target.value } })} className="h-10 px-3 rounded border border-outline bg-surface text-body-md" />
                    <input type="text" value={payment[inv.id]?.method || ''} onChange={(e) => setPayment({ ...payment, [inv.id]: { ...payment[inv.id], method: e.target.value } })} placeholder="Method" className="h-10 px-3 rounded border border-outline bg-surface text-body-md" />
                    <input type="text" value={payment[inv.id]?.reference || ''} onChange={(e) => setPayment({ ...payment, [inv.id]: { ...payment[inv.id], reference: e.target.value } })} placeholder="Reference" className="h-10 px-3 rounded border border-outline bg-surface text-body-md" />
                    <button onClick={() => payInvoice(inv.id)} className="h-10 px-4 bg-primary text-white rounded font-semibold">Record Payment</button>
                  </div>
                )}
              </div>
            ))}
            {invoices.length === 0 && <p className="text-body-md text-on-surface-variant">No invoices yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
