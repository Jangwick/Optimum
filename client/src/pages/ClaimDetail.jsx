import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getClaim, updateClaimStatus } from '../services/claim.service.js';
import { getClaimStatuses } from '../services/master-data.service.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';

export default function ClaimDetail() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [claimData, statusesData] = await Promise.all([getClaim(id), getClaimStatuses()]);
    setClaim(claimData.item);
    setStatuses(statusesData.items);
    setSelectedStatus(claimData.item.status?.code || '');
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTransition = async (e) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === claim.status?.code) return;
    await updateClaimStatus(id, { statusCode: selectedStatus, notes: note });
    setNote('');
    await load();
  };

  if (loading || !claim) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-[260px]">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">Loading...</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">{claim.claimNumber}</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                {claim.claimType?.name} · {claim.client?.name}
              </p>
            </div>
            <div
              className="px-4 py-1.5 rounded-full text-label-md font-medium"
              style={{
                backgroundColor: `${claim.status?.color}20`,
                color: claim.status?.color,
              }}
            >
              {claim.status?.code}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                <h3 className="text-headline-sm font-semibold text-primary mb-4">Claim Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-body-md">
                  <div>
                    <span className="text-label-md text-outline uppercase">Policy</span>
                    <p className="font-mono mt-1">{claim.policy?.policyNumber}</p>
                  </div>
                  <div>
                    <span className="text-label-md text-outline uppercase">Insurer</span>
                    <p className="mt-1">{claim.insuranceCompany?.name}</p>
                  </div>
                  <div>
                    <span className="text-label-md text-outline uppercase">Date of Loss</span>
                    <p className="mt-1">
                      {claim.dateOfLoss ? new Date(claim.dateOfLoss).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-label-md text-outline uppercase">Received</span>
                    <p className="mt-1">{new Date(claim.dateReceived).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-label-md text-outline uppercase">Estimated Loss</span>
                    <p className="font-mono mt-1">{claim.estimatedLoss ? `$${claim.estimatedLoss}` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-label-md text-outline uppercase">Reserve</span>
                    <p className="font-mono mt-1">{claim.reserve ? `$${claim.reserve}` : '—'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-label-md text-outline uppercase">Description</span>
                  <p className="text-body-md mt-1">{claim.description}</p>
                </div>
              </section>

              <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                <h3 className="text-headline-sm font-semibold text-primary mb-4">Assignment</h3>
                <div className="grid grid-cols-2 gap-4 text-body-md">
                  <div>
                    <span className="text-label-md text-outline uppercase">Engineer</span>
                    <p className="mt-1">{claim.engineer?.fullName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-label-md text-outline uppercase">Accountant</span>
                    <p className="mt-1">{claim.accountant?.fullName || '—'}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                <h3 className="text-headline-sm font-semibold text-primary mb-4">Update Status</h3>
                <form onSubmit={handleTransition} className="space-y-4">
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                    >
                      {statuses.map((s) => (
                        <option key={s.id} value={s.code}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-body-sm font-semibold mb-1.5">Notes</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors"
                  >
                    Update Status
                  </button>
                </form>
              </section>

              <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
                <h3 className="text-headline-sm font-semibold text-primary mb-4">Status History</h3>
                <ul className="space-y-3 text-body-sm">
                  {claim.history?.map((h) => (
                    <li key={h.id} className="border-l-2 border-primary pl-3">
                      <p className="font-medium">{h.status?.code}</p>
                      <p className="text-on-surface-variant">{h.notes || 'No notes'}</p>
                      <p className="text-label-sm text-outline mt-1">
                        {h.changedBy} · {new Date(h.createdAt).toLocaleString()}
                      </p>
                    </li>
                  )) || <p className="text-on-surface-variant">No history yet.</p>}
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
