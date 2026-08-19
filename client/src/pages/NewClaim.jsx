import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClaim } from '../services/claim.service.js';
import { getPolicies } from '../services/master-data.service.js';
import { getUsers } from '../services/user.service.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';

export default function NewClaim() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    policyId: '',
    description: '',
    dateOfLoss: '',
    locationOfLoss: '',
    estimatedLoss: '',
    reserve: '',
    engineerId: '',
    accountantId: '',
  });

  useEffect(() => {
    Promise.all([getPolicies(), getUsers()])
      .then(([policiesData, usersData]) => {
        setPolicies(policiesData.items || []);
        setUsers(usersData.users || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const engineers = users.filter((u) => u.role === 'ENGINEER');
  const accountants = users.filter((u) => u.role === 'ACCOUNTANT');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form };
    ['estimatedLoss', 'reserve'].forEach((k) => {
      payload[k] = payload[k] ? Number(payload[k]) : 0;
    });
    ['policyId', 'engineerId', 'accountantId'].forEach((k) => {
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
          <h2 className="text-headline-lg font-semibold text-primary mb-6">New Claim</h2>

          <form onSubmit={handleSubmit} className="max-w-3xl bg-surface border border-surface-border rounded shadow-sm p-6 space-y-4">
            <div>
              <label className="block text-body-sm font-semibold mb-1.5">Policy</label>
              <select
                value={form.policyId}
                onChange={(e) => setForm({ ...form, policyId: e.target.value })}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                required
              >
                <option value="">Select a policy</option>
                {policies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.policyNumber} · {p.client?.name} · {p.insuranceCompany?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body-sm font-semibold mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Date of Loss</label>
                <input
                  type="date"
                  value={form.dateOfLoss}
                  onChange={(e) => setForm({ ...form, dateOfLoss: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Location</label>
                <input
                  type="text"
                  value={form.locationOfLoss}
                  onChange={(e) => setForm({ ...form, locationOfLoss: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Estimated Loss</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.estimatedLoss}
                  onChange={(e) => setForm({ ...form, estimatedLoss: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Reserve</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.reserve}
                  onChange={(e) => setForm({ ...form, reserve: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Engineer</label>
                <select
                  value={form.engineerId}
                  onChange={(e) => setForm({ ...form, engineerId: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="">Select engineer</option>
                  {engineers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-sm font-semibold mb-1.5">Accountant</label>
                <select
                  value={form.accountantId}
                  onChange={(e) => setForm({ ...form, accountantId: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="">Select accountant</option>
                  {accountants.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors"
            >
              Create Claim
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
