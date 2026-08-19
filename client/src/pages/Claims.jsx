import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClaims } from '../services/claim.service.js';
import { getClaimStatuses } from '../services/master-data.service.js';
import { formatCurrency } from '../utils/currency.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';

function StatusPill({ code, color }) {
  return (
    <span
      className="inline-flex items-center px-3 py-0.5 rounded-full text-label-md font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {code}
    </span>
  );
}

export default function Claims() {
  const [claims, setClaims] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getClaims(), getClaimStatuses()])
      .then(([claimsData, statusesData]) => {
        setClaims(claimsData.items || []);
        setStatuses(statusesData.items || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = claims.filter((c) => {
    const matchesSearch =
      !search ||
      c.claimNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || c.status?.code === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">Claims</h2>
              <p className="text-body-md text-on-surface-variant mt-1">Manage and track all claims.</p>
            </div>
            <button
              onClick={() => navigate('/claims/new')}
              className="bg-primary text-white px-4 py-2 rounded text-label-md uppercase hover:bg-primary-container transition-colors"
            >
              + New Claim
            </button>
          </div>

          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 mb-6 flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claim number, client, or description"
              className="flex-1 h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-surface border border-surface-border rounded shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high text-on-surface-variant text-label-md uppercase sticky top-0">
                <tr>
                  <th className="px-6 py-3 font-medium">Claim #</th>
                  <th className="px-6 py-3 font-medium">Client</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Engineer</th>
                  <th className="px-6 py-3 font-medium">Reserve</th>
                  <th className="px-6 py-3 font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-body-md text-on-surface-variant">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-body-md text-on-surface-variant">
                      No claims found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((claim) => (
                    <tr
                      key={claim.id}
                      onClick={() => navigate(`/claims/${claim.id}`)}
                      className="hover:bg-surface-container-low cursor-pointer"
                    >
                      <td className="px-6 py-3 font-mono text-body-md font-medium text-primary">{claim.claimNumber}</td>
                      <td className="px-6 py-3 text-body-md">{claim.client?.name}</td>
                      <td className="px-6 py-3 text-body-md">{claim.claimType?.name}</td>
                      <td className="px-6 py-3">
                        <StatusPill code={claim.status?.code} color={claim.status?.color} />
                      </td>
                      <td className="px-6 py-3 text-body-md">{claim.engineer?.fullName || '—'}</td>
                      <td className="px-6 py-3 font-mono text-body-md">{formatCurrency(claim.reserve)}</td>
                      <td className="px-6 py-3 text-body-sm text-on-surface-variant">
                        {new Date(claim.dateReceived).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
