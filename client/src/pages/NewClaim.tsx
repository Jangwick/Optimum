import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { createClaim } from '../services/claim.service.js';
import { getPolicies, getClaimTypes, getInsuranceCompanies, getClients } from '../services/master-data.service.js';
import { getUsers } from '../services/user.service.js';
import { AppLayout } from '../components/AppLayout.jsx';
import { FileText, ClipboardList } from 'lucide-react';

interface NewClaimForm {
  [key: string]: string;
  description: string;
  dateOfLoss: string;
  locationOfLoss: string;
  estimatedLoss: string;
  reserve: string;
  engineerId: string;
  accountantId: string;
  policyId: string;
  claimNumber: string;
  insuredName: string;
  insurerClaimNumber: string;
  assignedByName: string;
  handlingAdjuster: string;
  natureOfLoss: string;
  clientId: string;
  insuranceCompanyId: string;
  claimTypeId: string;
  policyNumber: string;
  policyType: string;
  policyPeriodText: string;
  policyCoverageText: string;
  claimedAmount: string;
}

const EMPTY_FORM: NewClaimForm = {
  description: '',
  dateOfLoss: '',
  locationOfLoss: '',
  estimatedLoss: '',
  reserve: '',
  engineerId: '',
  accountantId: '',
  policyId: '',
  claimNumber: '',
  insuredName: '',
  insurerClaimNumber: '',
  assignedByName: '',
  handlingAdjuster: '',
  natureOfLoss: '',
  clientId: '',
  insuranceCompanyId: '',
  claimTypeId: '',
  policyNumber: '',
  policyType: '',
  policyPeriodText: '',
  policyCoverageText: '',
  claimedAmount: '',
};

export default function NewClaim() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'policy' | 'assignment'>('policy');
  const [policies, setPolicies] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [claimTypes, setClaimTypes] = useState<Record<string, unknown>[]>([]);
  const [insurers, setInsurers] = useState<Record<string, unknown>[]>([]);
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<NewClaimForm>(EMPTY_FORM);

  useEffect(() => {
    Promise.all([getPolicies(), getUsers(), getClaimTypes(), getInsuranceCompanies(), getClients()])
      .then(([policiesData, usersData, claimTypesData, insurersData, clientsData]) => {
        setPolicies(
          ((policiesData as Record<string, unknown>).items as Record<string, unknown>[] | undefined) ?? []
        );
        setUsers(((usersData as Record<string, unknown>).users as Record<string, unknown>[] | undefined) ?? []);
        setClaimTypes(
          ((claimTypesData as Record<string, unknown>).items as Record<string, unknown>[] | undefined) ?? []
        );
        setInsurers(
          ((insurersData as Record<string, unknown>).items as Record<string, unknown>[] | undefined) ?? []
        );
        setClients(
          ((clientsData as Record<string, unknown>).items as Record<string, unknown>[] | undefined) ?? []
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const engineers = users.filter((u) => (u['role'] as string) === 'ENGINEER');
  const accountants = users.filter((u) => (u['role'] as string) === 'ACCOUNTANT');

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    ['estimatedLoss', 'reserve', 'claimedAmount'].forEach((k) => {
      const value = payload[k] as string | undefined;
      payload[k] = value ? Number(value) : 0;
    });
    ['policyId', 'engineerId', 'accountantId', 'clientId', 'insuranceCompanyId', 'claimTypeId'].forEach((k) => {
      const value = payload[k] as string | undefined;
      payload[k] = value ? Number(value) : null;
    });
    try {
      const res = (await createClaim(payload)) as Record<string, unknown>;
      const item = res['item'] as Record<string, unknown> | undefined;
      const id = item?.['id'] as string | number | undefined;
      navigate('/claims/' + id);
    } catch (err) {
      if (err instanceof AxiosError) {
        const data = err.response?.data as Record<string, unknown> | undefined;
        alert((data?.['error'] as string | undefined) || 'Failed to create claim');
      } else {
        alert('Failed to create claim');
      }
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <AppLayout>
      <h2 className="text-headline-lg font-semibold text-primary mb-2">New Claim</h2>
      <p className="text-body-md text-on-surface-variant mb-6">Choose how to record this claim</p>

      {/* Mode selector */}
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => setMode('policy')}
          className={`flex items-center gap-2 px-4 py-3 rounded border text-body-md transition-colors ${
            mode === 'policy'
              ? 'border-primary bg-primary/5 text-primary font-semibold'
              : 'border-outline bg-surface text-on-surface-variant hover:border-primary/50'
          }`}
        >
          <FileText size={20} strokeWidth={1.5} />
          <div className="text-left">
            <div>From Policy</div>
            <div className="text-label-sm text-on-surface-variant font-normal">Full intake with existing policy</div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setMode('assignment')}
          className={`flex items-center gap-2 px-4 py-3 rounded border text-body-md transition-colors ${
            mode === 'assignment'
              ? 'border-primary bg-primary/5 text-primary font-semibold'
              : 'border-outline bg-surface text-on-surface-variant hover:border-primary/50'
          }`}
        >
          <ClipboardList size={20} strokeWidth={1.5} />
          <div className="text-left">
            <div>Record Assignment</div>
            <div className="text-label-sm text-on-surface-variant font-normal">Excel-style direct entry</div>
          </div>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl bg-surface border border-surface-border rounded shadow-sm p-6 space-y-6">
        {mode === 'policy' && (
          <>
            <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Policy & Parties</h3>
            <div>
              <label className="block text-body-sm font-semibold mb-1.5">Policy *</label>
              <select
                value={form['policyId'] as string}
                onChange={set('policyId')}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                required
              >
                <option value="">Select a policy</option>
                {policies.map((p) => (
                  <option key={(p['id'] as string | number) ?? ''} value={(p['id'] as string | number) ?? ''}>
                    {(p['policyNumber'] as string | undefined) ?? ''} · {(p['client'] as Record<string, unknown> | undefined)?.['name'] as string | undefined} · {(p['insuranceCompany'] as Record<string, unknown> | undefined)?.['name'] as string | undefined}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {mode === 'assignment' && (
          <>
            <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Assignment Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">OCS Ref. No. *</label>
                <input
                  type="text"
                  value={form['claimNumber'] as string}
                  onChange={set('claimNumber')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  required
                  placeholder="OCS-XXXXXX/XXX"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Insurer&apos;s Claim No.</label>
                <input
                  type="text"
                  value={form['insurerClaimNumber'] as string}
                  onChange={set('insurerClaimNumber')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Assigned By</label>
                <input
                  type="text"
                  value={form['assignedByName'] as string}
                  onChange={set('assignedByName')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Handling Adjuster</label>
                <input
                  type="text"
                  value={form['handlingAdjuster'] as string}
                  onChange={set('handlingAdjuster')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  placeholder="Adjuster code"
                />
              </div>
            </div>

            <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Insured & Insurance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Insured Name *</label>
                <input
                  type="text"
                  value={form['insuredName'] as string}
                  onChange={set('insuredName')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Client (linked)</label>
                <select
                  value={form['clientId'] as string}
                  onChange={set('clientId')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="">— Unresolved —</option>
                  {clients.map((c) => (
                    <option key={(c['id'] as string | number) ?? ''} value={(c['id'] as string | number) ?? ''}>
                      {(c['name'] as string | undefined) ?? ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Insurer</label>
                <select
                  value={form['insuranceCompanyId'] as string}
                  onChange={set('insuranceCompanyId')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="">— Unresolved —</option>
                  {insurers.map((i) => (
                    <option key={(i['id'] as string | number) ?? ''} value={(i['id'] as string | number) ?? ''}>
                      {(i['name'] as string | undefined) ?? ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Claim Type</label>
                <select
                  value={form['claimTypeId'] as string}
                  onChange={set('claimTypeId')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="">— Unresolved —</option>
                  {claimTypes.map((t) => (
                    <option key={(t['id'] as string | number) ?? ''} value={(t['id'] as string | number) ?? ''}>
                      {(t['name'] as string | undefined) ?? ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Policy Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Policy No.</label>
                <input
                  type="text"
                  value={form['policyNumber'] as string}
                  onChange={set('policyNumber')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Type of Policy</label>
                <input
                  type="text"
                  value={form['policyType'] as string}
                  onChange={set('policyType')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-body-sm font-semibold mb-1.5">Policy Period</label>
                <input
                  type="text"
                  value={form['policyPeriodText'] as string}
                  onChange={set('policyPeriodText')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  placeholder="e.g. January 1, 2024 - January 1, 2025"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-body-sm font-semibold mb-1.5">Policy Coverage / Total Sum Insured</label>
                <input
                  type="text"
                  value={form['policyCoverageText'] as string}
                  onChange={set('policyCoverageText')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </>
        )}

        <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Loss Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">Date of Loss *</label>
            <input
              type="date"
              value={form['dateOfLoss'] as string}
              onChange={set('dateOfLoss')}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">Location</label>
            <input
              type="text"
              value={form['locationOfLoss'] as string}
              onChange={set('locationOfLoss')}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
          </div>
          {mode === 'assignment' && (
            <>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Nature of Loss</label>
                <input
                  type="text"
                  value={form['natureOfLoss'] as string}
                  onChange={set('natureOfLoss')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  placeholder="e.g. Fire, Burglary"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Amount of Claim</label>
                <input
                  type="number"
                  step="0.01"
                  value={form['claimedAmount'] as string}
                  onChange={set('claimedAmount')}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">Estimated Loss</label>
            <input
              type="number"
              step="0.01"
              value={form['estimatedLoss'] as string}
              onChange={set('estimatedLoss')}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">Reserve</label>
            <input
              type="number"
              step="0.01"
              value={form['reserve'] as string}
              onChange={set('reserve')}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {mode === 'policy' && (
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">Description</label>
            <textarea
              value={form['description'] as string}
              onChange={set('description')}
              rows={3}
              className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
              required
            />
          </div>
        )}

        <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Assignments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">Engineer</label>
            <select
              value={form['engineerId'] as string}
              onChange={set('engineerId')}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            >
              <option value="">Select engineer</option>
              {engineers.map((u) => (
                <option key={(u['id'] as string | number) ?? ''} value={(u['id'] as string | number) ?? ''}>
                  {(u['fullName'] as string | undefined) ?? ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-sm font-semibold mb-1.5">Accountant</label>
            <select
              value={form['accountantId'] as string}
              onChange={set('accountantId')}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            >
              <option value="">Select accountant</option>
              {accountants.map((u) => (
                <option key={(u['id'] as string | number) ?? ''} value={(u['id'] as string | number) ?? ''}>
                  {(u['fullName'] as string | undefined) ?? ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors">
          Create Claim
        </button>
      </form>
    </AppLayout>
  );
}
