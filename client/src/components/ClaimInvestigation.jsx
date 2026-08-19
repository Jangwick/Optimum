import { useEffect, useState, useCallback } from 'react';
import { getInvestigations, createInvestigation, getContacts, createContact, getInspections, createInspection, updateInspection, uploadInspectionPhoto } from '../services/investigation.service.js';
import { Search, Users, Calendar, MapPin, FileText, Camera, CheckCircle, Plus } from 'lucide-react';

export default function ClaimInvestigation({ claimId }) {
  const [tab, setTab] = useState('investigations');
  const [investigations, setInvestigations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    const [inv, con, ins] = await Promise.all([
      getInvestigations(claimId),
      getContacts(claimId),
      getInspections(claimId),
    ]);
    setInvestigations(inv.items || []);
    setContacts(con.items || []);
    setInspections(ins.items || []);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, refresh, load]);

  const [invForm, setInvForm] = useState({ findings: '', notes: '' });
  const [conForm, setConForm] = useState({ name: '', role: '', phone: '', email: '' });
  const [inspForm, setInspForm] = useState({ scheduledAt: '', location: '', scope: '', notes: '' });
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
    await createInspection(claimId, { ...inspForm, scheduledAt: inspForm.scheduledAt ? new Date(inspForm.scheduledAt).toISOString() : null });
    setInspForm({ scheduledAt: '', location: '', scope: '', notes: '' });
    setRefresh((r) => r + 1);
  };

  const completeInspection = async (id) => {
    await updateInspection(claimId, id, { findings: findings[id] || '', conductedAt: new Date().toISOString() });
    setFindings({ ...findings, [id]: '' });
    setRefresh((r) => r + 1);
  };

  const uploadPhoto = async (inspectionId) => {
    const file = photos[inspectionId];
    if (!file) return;
    await uploadInspectionPhoto(claimId, inspectionId, file, 'Inspection photo');
    setPhotos({ ...photos, [inspectionId]: null });
    // Reset the file input
    const input = document.getElementById(`photo-input-${inspectionId}`);
    if (input) input.value = '';
    setRefresh((r) => r + 1);
  };

  const tabs = [
    { key: 'investigations', label: 'Investigations', icon: Search },
    { key: 'contacts', label: 'Contacts', icon: Users },
    { key: 'inspections', label: 'Inspections', icon: Calendar },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-surface-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-body-md font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
            }`}
          >
            <t.icon size={16} className={tab === t.key ? 'text-primary' : 'text-outline'} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'investigations' && (
        <div className="space-y-6">
          <form onSubmit={saveInvestigation} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Search size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Add Investigation</h3>
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Findings</label>
              <textarea value={invForm.findings} onChange={(e) => setInvForm({ ...invForm, findings: e.target.value })} placeholder="Investigation findings..." className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none" rows={3} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <textarea value={invForm.notes} onChange={(e) => setInvForm({ ...invForm, notes: e.target.value })} placeholder="Additional notes..." className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none" rows={2} />
            </div>
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2">
              <Plus size={16} />
              Save Investigation
            </button>
          </form>
          <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
            {investigations.map((i) => (
              <div key={i.id} className="p-3 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className="text-primary" />
                  <p className="text-body-md font-semibold">Investigation #{i.id}</p>
                </div>
                <p className="text-body-md mt-1">{i.findings || '—'}</p>
                {i.notes && <p className="text-body-sm text-on-surface-variant mt-1">{i.notes}</p>}
                <p className="text-label-sm text-outline mt-2 font-mono">{new Date(i.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {investigations.length === 0 && <p className="text-body-md text-on-surface-variant">No investigations recorded.</p>}
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div className="space-y-6">
          <form onSubmit={saveContact} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Add Contact</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Name</label>
                <input type="text" value={conForm.name} onChange={(e) => setConForm({ ...conForm, name: e.target.value })} placeholder="Contact name" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" required />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Role</label>
                <input type="text" value={conForm.role} onChange={(e) => setConForm({ ...conForm, role: e.target.value })} placeholder="Role / title" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Phone</label>
                <input type="tel" value={conForm.phone} onChange={(e) => setConForm({ ...conForm, phone: e.target.value })} placeholder="Phone number" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Email</label>
                <input type="email" value={conForm.email} onChange={(e) => setConForm({ ...conForm, email: e.target.value })} placeholder="Email address" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
            </div>
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2">
              <Plus size={16} />
              Save Contact
            </button>
          </form>
          <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="p-3 bg-surface-container-low rounded-lg">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-primary" />
                  <p className="text-body-md font-semibold">{c.name}</p>
                  {c.role && <span className="text-label-md text-on-surface-variant">· {c.role}</span>}
                </div>
                <p className="text-body-sm text-on-surface-variant mt-1">
                  {c.phone && <span>{c.phone}</span>}
                  {c.phone && c.email && <span> · </span>}
                  {c.email && <span>{c.email}</span>}
                  {!c.phone && !c.email && <span>No contact details</span>}
                </p>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-body-md text-on-surface-variant">No contacts recorded.</p>}
          </div>
        </div>
      )}

      {tab === 'inspections' && (
        <div className="space-y-6">
          <form onSubmit={saveInspection} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Schedule Inspection</h3>
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Scheduled Date & Time</label>
              <input type="datetime-local" value={inspForm.scheduledAt} onChange={(e) => setInspForm({ ...inspForm, scheduledAt: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" required />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Location</label>
              <input type="text" value={inspForm.location} onChange={(e) => setInspForm({ ...inspForm, location: e.target.value })} placeholder="Inspection location" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Scope</label>
              <textarea value={inspForm.scope} onChange={(e) => setInspForm({ ...inspForm, scope: e.target.value })} placeholder="Inspection scope..." className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none" rows={2} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <textarea value={inspForm.notes} onChange={(e) => setInspForm({ ...inspForm, notes: e.target.value })} placeholder="Additional notes..." className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none" rows={2} />
            </div>
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2">
              <Plus size={16} />
              Schedule Inspection
            </button>
          </form>

          <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-4">
            {inspections.map((i) => {
              const isCompleted = !!i.conductedAt;
              return (
                <div key={i.id} className="p-4 bg-surface-container-low rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary shrink-0" />
                        <p className="text-body-md font-semibold">
                          {i.scheduledAt ? new Date(i.scheduledAt).toLocaleString() : 'Unscheduled'}
                        </p>
                      </div>
                      {i.location && (
                        <p className="text-body-sm text-on-surface-variant mt-1 flex items-center gap-1">
                          <MapPin size={12} className="shrink-0" />
                          {i.location}
                        </p>
                      )}
                      {i.scope && <p className="text-body-sm text-on-surface-variant mt-1">{i.scope}</p>}
                      {i.notes && <p className="text-body-sm text-on-surface-variant mt-1">{i.notes}</p>}
                      {isCompleted && i.findings && (
                        <div className="mt-2 pt-2 border-t border-surface-border">
                          <span className="text-label-md text-outline uppercase">Findings</span>
                          <p className="text-body-sm mt-0.5">{i.findings}</p>
                          <p className="text-label-sm text-outline mt-1 font-mono">
                            Completed: {new Date(i.conductedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-md font-medium shrink-0 ${
                        isCompleted
                          ? 'bg-success/10 text-success'
                          : 'bg-accent-orange/10 text-accent-orange'
                      }`}
                    >
                      {isCompleted && <CheckCircle size={12} />}
                      {isCompleted ? 'Completed' : 'Scheduled'}
                    </span>
                  </div>

                  {!isCompleted && (
                    <div className="mt-3 pt-3 border-t border-surface-border space-y-2">
                      <div>
                        <label className="block text-label-md text-outline uppercase mb-1.5">Completion Findings</label>
                        <textarea
                          value={findings[i.id] || ''}
                          onChange={(e) => setFindings({ ...findings, [i.id]: e.target.value })}
                          placeholder="Enter inspection findings..."
                          className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <button
                          onClick={() => completeInspection(i.id)}
                          className="h-10 px-4 bg-success text-white rounded font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Complete Inspection
                        </button>
                        <div className="flex items-center gap-2">
                          <input
                            id={`photo-input-${i.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotos({ ...photos, [i.id]: e.target.files[0] })}
                            className="text-body-sm"
                          />
                          <button
                            onClick={() => uploadPhoto(i.id)}
                            disabled={!photos[i.id]}
                            className="h-10 px-4 bg-secondary text-white rounded font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Camera size={16} />
                            Upload Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {i.photos?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-surface-border">
                      <span className="text-label-md text-outline uppercase">Photos ({i.photos.length})</span>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {i.photos.map((p) => (
                          <div key={p.id} className="bg-surface-container-high p-2 rounded text-center">
                            <Camera size={20} className="text-on-surface-variant mx-auto" />
                            <p className="text-label-sm text-ellipsis overflow-hidden mt-1 truncate">{p.originalName}</p>
                            {p.caption && <p className="text-label-sm text-outline">{p.caption}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {inspections.length === 0 && <p className="text-body-md text-on-surface-variant">No inspections scheduled.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
