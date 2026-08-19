import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClaim } from '../services/claim.service.js';
import { getPolicies, getClaimTypes, getInsuranceCompanies, getClients } from '../services/master-data.service.js';
import { getUsers } from '../services/user.service.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { FileText, ClipboardList } from 'lucide-react';

export default function NewClaim() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('policy'); // 'policy' | 'assignment'
  const [policies, setPolicies] = useState([]);
  const [users, setUsers] = useState([]);
  const [claimTypes, setClaimTypes] = useState([]);
  const [insurers, setInsurers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    // Shared
    description: '',
    dateOfLoss: '',
    locationOfLoss: '',
    estimatedLoss: '',
    reserve: '',
    engineerId: '',
    accountantId: '',
    // Policy-driven
    policyId: '',
    // Direct assignment
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
  });

  useEffect(() => {
    Promise.all([getPolicies(), getUsers(), getClaimTypes(), getInsuranceCompanies(), getClients()])
      .then(([policiesData, usersData, claimTypesData, insurersData, clientsData]) => {
        setPolicies(policiesData.items || []);
        setUsers(usersData.users || []);
        setClaimTypes(claimTypesData.items || []);
        setInsurers(insurersData.items || []);
        setClients(clientsData.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const engineers = users.filter((u) => u.role === 'ENGINEER');
  const accountants = users.filter((u) => u.role === 'ACCOUNTANT');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    ['estimatedLoss', 'reserve', 'claimedAmount'].forEach((k) => {
      payload[k] = payload[k] ? Number(payload[k]) : 0;
    });
    ['policyId', 'engineerId', 'accountantId', 'clientId', 'insuranceCompanyId', 'claimTypeId'].forEach((k) => {
      payload[k] = payload[k] ? Number(payload[k]) : null;
    });
    try {
      const res = await createClaim(payload);
      navigate(`/claims/${res.item.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create claim');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-headline-lg font-semibold text-primary mb-2">New Claim</h2>
          <p className="text-body-md text-on-surface-variant mb-6">
            Choose how to record this claim
          </p>

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
                  <select value={form.policyId} onChange={set('policyId')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" required>
                    <option value="">Select a policy</option>
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.policyNumber} · {p.client?.name} · {p.insuranceCompany?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {mode === 'assignment' && (
              <>
                <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Assignment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">OCS Ref. No. *</label>
                    <input type="text" value={form.claimNumber} onChange={set('claimNumber')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" required placeholder="OCS-XXXXXX/XXX" />
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Insurer&apos;s Claim No.</label>
                    <input type="text" value={form.insurerClaimNumber} onChange={set('insurerClaimNumber')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Assigned By</label>
                    <input type="text" value={form.assignedByName} onChange={set('assignedByName')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Handling Adjuster</label>
                    <input type="text" value={form.handlingAdjuster} onChange={set('handlingAdjuster')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" placeholder="Adjuster code" />
                  </div>
                </div>

                <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Insured & Insurance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Insured Name *</label>
                    <input type="text" value={form.insuredName} onChange={set('insuredName')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Client (linked)</label>
                    <select value={form.clientId} onChange={set('clientId')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary">
                      <option value="">— Unresolved —</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Insurer</label>
                    <select value={form.insuranceCompanyId} onChange={set('insuranceCompanyId')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary">
                      <option value="">— Unresolved —</option>
                      {insurers.map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Claim Type</label>
                    <select value={form.claimTypeId} onChange={set('claimTypeId')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary">
                      <option value="">— Unresolved —</option>
                      {claimTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Policy Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Policy No.</label>
                    <input type="text" value={form.policyNumber} onChange={set('policyNumber')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Type of Policy</label>
                    <input type="text" value={form.policyType} onChange={set('policyType')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-body-sm font-semibold mb-1.5">Policy Period</label>
                    <input type="text" value={form.policyPeriodText} onChange={set('policyPeriodText')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" placeholder="e.g. January 1, 2024 - January 1, 2025" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-body-sm font-semibold mb-1.5">Policy Coverage / Total Sum Insured</label>
                    <input type="text" value={form.policyCoverageText} onChange={set('policyCoverageText')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
                  </div>
                </div>
              </>
            )}

            <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Loss Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Date of Loss *</label>
                <input type="date" value={form.dateOfLoss} onChange={set('dateOfLoss')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Location</label>
                <input type="text" value={form.locationOfLoss} onChange={set('locationOfLoss')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
              </div>
              {mode === 'assignment' && (
                <>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Nature of Loss</label>
                    <input type="text" value={form.natureOfLoss} onChange={set('natureOfLoss')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" placeholder="e.g. Fire, Burglary" />
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Amount of Claim</label>
                    <input type="number" step="0.01" value={form.claimedAmount} onChange={set('claimedAmount')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Estimated Loss</label>
                <input type="number" step="0.01" value={form.estimatedLoss} onChange={set('estimatedLoss')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Reserve</label>
                <input type="number" step="0.01" value={form.reserve} onChange={set('reserve')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" />
              </div>
            </div>

            {mode === 'policy' && (
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={3} className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary" required />
              </div>
            )}

            <h3 className="text-body-lg font-semibold text-primary border-b border-surface-border pb-2">Assignments</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Engineer</label>
                <select value={form.engineerId} onChange={set('engineerId')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary">
                  <option value="">Select engineer</option>
                  {engineers.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Accountant</label>
                <select value={form.accountantId} onChange={set('accountantId')} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary">
                  <option value="">Select accountant</option>
                  {accountants.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors">
              Create Claim
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
