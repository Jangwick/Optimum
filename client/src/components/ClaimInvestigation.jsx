import { useEffect, useState } from 'react';
import { getInvestigations, createInvestigation, getContacts, createContact, getInspections, createInspection, updateInspection } from '../services/investigation.service.js';

export default function ClaimInvestigation({ claimId }) {
  const [tab, setTab] = useState('investigations');
  const [investigations, setInvestigations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const load = async () => {
    const [inv, con, ins] = await Promise.all([
      getInvestigations(claimId),
      getContacts(claimId),
      getInspections(claimId),
    ]);
    setInvestigations(inv.items || []);
    setContacts(con.items || []);
    setInspections(ins.items || []);
  };

  useEffect(() => {
    load();
  }, [claimId, refresh]);

  const [invForm, setInvForm] = useState({ findings: '', notes: '' });
  const [conForm, setConForm] = useState({ name: '', role: '', phone: '', email: '' });
  const [inspForm, setInspForm] = useState({ scheduledDate: '', location: '', scope: '', notes: '' });
  const [findings, setFindings] = useState({});
  const [photos, setPhotos] = useState({});

  const saveInvestigation = async (e) => {
    e.preventDefault();
    await createInvestigation(claimId, invForm);
    setInvForm({ findings: '', notes: '' });
    setRefresh((r) => r + 1);
  };

  const saveContact = async (e) => {
    e.preventDefault();
    await createContact(claimId, conForm);
    setConForm({ name: '', role: '', phone: '', email: '' });
    setRefresh((r) => r + 1);
  };

  const saveInspection = async (e) => {
    e.preventDefault();
    await createInspection(claimId, { ...inspForm, scheduledDate: new Date(inspForm.scheduledDate) });
    setInspForm({ scheduledDate: '', location: '', scope: '', notes: '' });
    setRefresh((r) => r + 1);
  };

  const completeInspection = async (id) => {
    await updateInspection(claimId, id, { findings: findings[id], status: 'COMPLETED', completedAt: new Date() });
    setFindings({ ...findings, [id]: '' });
    setRefresh((r) => r + 1);
  };

  const uploadPhoto = async (inspectionId) => {
    const file = photos[inspectionId];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('caption', 'Inspection photo');
    // Uses document upload endpoint for MVP storage
    await fetch(`/api/claims/${claimId}/documents`, {
      method: 'POST',
      body: form,
      credentials: 'include',
    });
    setPhotos({ ...photos, [inspectionId]: null });
    setRefresh((r) => r + 1);
  };

  const tabs = [
    { key: 'investigations', label: 'Investigations' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'inspections', label: 'Inspections' },
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

      {tab === 'investigations' && (
        <div className="space-y-6">
          <form onSubmit={saveInvestigation} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
            <h3 className="text-headline-sm font-semibold text-primary">Add Investigation</h3>
            <textarea value={invForm.findings} onChange={(e) => setInvForm({ ...invForm, findings: e.target.value })} placeholder="Findings" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
            <textarea value={invForm.notes} onChange={(e) => setInvForm({ ...invForm, notes: e.target.value })} placeholder="Notes" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Save</button>
          </form>
          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
            {investigations.map((i) => (
              <div key={i.id} className="p-3 bg-surface-container-low rounded">
                <p className="text-body-md font-semibold">Investigation #{i.id}</p>
                <p className="text-body-md mt-1">{i.findings}</p>
                <p className="text-body-sm text-on-surface-variant">{i.notes}</p>
              </div>
            ))}
            {investigations.length === 0 && <p className="text-body-md text-on-surface-variant">No investigations.</p>}
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className="space-y-6">
          <form onSubmit={saveContact} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
            <h3 className="text-headline-sm font-semibold text-primary">Add Contact</h3>
            <input type="text" value={conForm.name} onChange={(e) => setConForm({ ...conForm, name: e.target.value })} placeholder="Name" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" required />
            <input type="text" value={conForm.role} onChange={(e) => setConForm({ ...conForm, role: e.target.value })} placeholder="Role" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <input type="tel" value={conForm.phone} onChange={(e) => setConForm({ ...conForm, phone: e.target.value })} placeholder="Phone" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <input type="email" value={conForm.email} onChange={(e) => setConForm({ ...conForm, email: e.target.value })} placeholder="Email" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Save</button>
          </form>
          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="p-3 bg-surface-container-low rounded">
                <p className="text-body-md font-semibold">{c.name}</p>
                <p className="text-body-sm text-on-surface-variant">{c.role} · {c.phone} · {c.email}</p>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-body-md text-on-surface-variant">No contacts.</p>}
          </div>
        </div>
      )}

      {tab === 'inspections' && (
        <div className="space-y-6">
          <form onSubmit={saveInspection} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
            <h3 className="text-headline-sm font-semibold text-primary">Schedule Inspection</h3>
            <input type="datetime-local" value={inspForm.scheduledDate} onChange={(e) => setInspForm({ ...inspForm, scheduledDate: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" required />
            <input type="text" value={inspForm.location} onChange={(e) => setInspForm({ ...inspForm, location: e.target.value })} placeholder="Location" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <textarea value={inspForm.scope} onChange={(e) => setInspForm({ ...inspForm, scope: e.target.value })} placeholder="Scope" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
            <textarea value={inspForm.notes} onChange={(e) => setInspForm({ ...inspForm, notes: e.target.value })} placeholder="Notes" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Schedule</button>
          </form>

          <div className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-4">
            {inspections.map((i) => (
              <div key={i.id} className="p-3 bg-surface-container-low rounded">
                <div className="flex justify-between items-center">
                  <p className="text-body-md font-semibold">{new Date(i.scheduledDate).toLocaleString()}</p>
                  <span className="px-2 py-0.5 rounded text-label-md font-medium" style={{ background: i.status === 'COMPLETED' ? '#e8f5e9' : '#fff3e0', color: i.status === 'COMPLETED' ? '#28a745' : '#f26522' }}>{i.status}</span>
                </div>
                <p className="text-body-md mt-1">{i.location}</p>
                <p className="text-body-sm text-on-surface-variant">{i.scope}</p>
                {i.status !== 'COMPLETED' && (
                  <div className="mt-3 space-y-2">
                    <textarea value={findings[i.id] || ''} onChange={(e) => setFindings({ ...findings, [i.id]: e.target.value })} placeholder="Completion findings" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
                    <div className="flex gap-2">
                      <button onClick={() => completeInspection(i.id)} className="h-10 px-4 bg-primary text-white rounded font-semibold">Complete</button>
                      <input type="file" onChange={(e) => setPhotos({ ...photos, [i.id]: e.target.files[0] })} className="text-body-md" />
                      <button onClick={() => uploadPhoto(i.id)} className="h-10 px-4 bg-secondary text-white rounded font-semibold">Upload Photo</button>
                    </div>
                  </div>
                )}
                {i.photos?.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {i.photos.map((p) => (
                      <div key={p.id} className="bg-surface-container-high p-2 rounded text-center">
                        <p className="text-label-sm text-ellipsis overflow-hidden">{p.originalName}</p>
                        <p className="text-label-sm text-outline">{p.caption}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {inspections.length === 0 && <p className="text-body-md text-on-surface-variant">No inspections scheduled.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
