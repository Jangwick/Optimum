import { useEffect, useState, useCallback } from 'react';
import { getInvestigations, createInvestigation, deleteInvestigation, getContacts, createContact, deleteContact, getInspections, createInspection, updateInspection, deleteInspection, uploadInspectionPhoto } from '../services/investigation.service.js';
import { Search, Users, Calendar, MapPin, FileText, Camera, CheckCircle, Plus, Trash2 } from 'lucide-react';

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

  const removeInvestigation = async (id) => {
    if (!confirm('Delete this investigation?')) return;
    await deleteInvestigation(claimId, id);
    setRefresh((r) => r + 1);
  };

  const saveContact = async (e) => {
    e.preventDefault();
    await createContact(claimId, conForm);
    setConForm({ name: '', role: '', phone: '', email: '' });
    setRefresh((r) => r + 1);
  };

  const removeContact = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await deleteContact(claimId, id);
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

  const removeInspection = async (id) => {
    if (!confirm('Delete this inspection and all its photos?')) return;
    await deleteInspection(claimId, id);
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
          <div className="space-y-3">
            {investigations.map((i) => (
              <div key={i.id} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <p className="text-body-md font-semibold text-on-surface">Investigation #{i.id}</p>
                  </div>
                  <button
                    onClick={() => removeInvestigation(i.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                    title="Delete investigation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {i.findings && (
                    <div>
                      <span className="text-label-md text-outline uppercase">Findings</span>
                      <p className="text-body-sm text-on-surface mt-0.5">{i.findings}</p>
                    </div>
                  )}
                  {i.notes && (
                    <div>
                      <span className="text-label-md text-outline uppercase">Notes</span>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">{i.notes}</p>
                    </div>
                  )}
                  <p className="text-label-sm text-outline font-mono pt-1 border-t border-surface-border">{new Date(i.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {investigations.length === 0 && (
              <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
                <Search size={32} className="text-outline mx-auto mb-2" />
                <p className="text-body-md text-on-surface-variant">No investigations recorded yet.</p>
                <p className="text-body-sm text-outline mt-1">Use the form above to add one.</p>
              </div>
            )}
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
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-on-surface">{c.name}</p>
                      {c.role && <p className="text-label-sm text-on-surface-variant">{c.role}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeContact(c.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-3">
                    {c.phone && (
                      <div>
                        <span className="text-label-md text-outline uppercase">Phone</span>
                        <p className="text-body-sm text-on-surface mt-0.5 font-mono">{c.phone}</p>
                      </div>
                    )}
                    {c.email && (
                      <div>
                        <span className="text-label-md text-outline uppercase">Email</span>
                        <p className="text-body-sm text-on-surface mt-0.5 break-words">{c.email}</p>
                      </div>
                    )}
                  </div>
                  {!c.phone && !c.email && <p className="text-body-sm text-on-surface-variant">No contact details</p>}
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
                <Users size={32} className="text-outline mx-auto mb-2" />
                <p className="text-body-md text-on-surface-variant">No contacts recorded yet.</p>
                <p className="text-body-sm text-outline mt-1">Use the form above to add one.</p>
              </div>
            )}
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

          <div className="space-y-4">
            {inspections.map((i) => {
              const isCompleted = !!i.conductedAt;
              return (
                <div
                  key={i.id}
                  className={`bg-surface border border-surface-border rounded-lg shadow-sm overflow-hidden ${
                    isCompleted ? 'border-l-4 border-l-success' : 'border-l-4 border-l-accent-orange'
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-container-low">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-success/10 text-success' : 'bg-accent-orange/10 text-accent-orange'
                        }`}
                      >
                        {isCompleted ? <CheckCircle size={20} /> : <Calendar size={20} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-md font-semibold text-on-surface truncate">
                          {i.scheduledAt ? new Date(i.scheduledAt).toLocaleString() : 'Unscheduled'}
                        </p>
                        <p className="text-label-sm text-outline font-mono mt-0.5">
                          Inspection #{i.id}
                          {i.inspector && ` · ${i.inspector.firstName} ${i.inspector.lastName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md font-medium ${
                          isCompleted
                            ? 'bg-success/10 text-success'
                            : 'bg-accent-orange/10 text-accent-orange'
                        }`}
                      >
                        {isCompleted && <CheckCircle size={12} />}
                        {isCompleted ? 'Completed' : 'Scheduled'}
                      </span>
                      <button
                        onClick={() => removeInspection(i.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                        title="Delete inspection"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Card body — metadata */}
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {i.location && (
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-label-md text-outline uppercase">Location</p>
                            <p className="text-body-sm text-on-surface mt-0.5 break-words">{i.location}</p>
                          </div>
                        </div>
                      )}
                      {i.scope && (
                        <div className="flex items-start gap-2">
                          <Search size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-label-md text-outline uppercase">Scope</p>
                            <p className="text-body-sm text-on-surface mt-0.5 break-words">{i.scope}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {i.notes && (
                      <div className="flex items-start gap-2">
                        <FileText size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-label-md text-outline uppercase">Notes</p>
                          <p className="text-body-sm text-on-surface mt-0.5 break-words">{i.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Findings (completed) */}
                    {isCompleted && i.findings && (
                      <div className="mt-2 p-3 bg-success/5 border border-success/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle size={14} className="text-success shrink-0" />
                          <span className="text-label-md text-success uppercase font-medium">Findings</span>
                        </div>
                        <p className="text-body-sm text-on-surface">{i.findings}</p>
                        <p className="text-label-sm text-outline mt-2 font-mono">
                          Completed: {new Date(i.conductedAt).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Photos */}
                    {i.photos?.length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Camera size={16} className="text-on-surface-variant shrink-0" />
                          <span className="text-label-md text-outline uppercase">Photos ({i.photos.length})</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {i.photos.map((p) => (
                            <div key={p.id} className="bg-surface-container-high p-2 rounded-lg text-center border border-surface-border">
                              <Camera size={24} className="text-on-surface-variant mx-auto" />
                              <p className="text-label-sm mt-1 truncate" title={p.originalName}>{p.originalName}</p>
                              {p.caption && <p className="text-label-sm text-outline truncate">{p.caption}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions (not completed) */}
                    {!isCompleted && (
                      <div className="mt-2 pt-3 border-t border-surface-border space-y-3">
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
                            className="h-10 px-4 bg-success text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                          >
                            <CheckCircle size={16} />
                            Complete Inspection
                          </button>
                          <div className="flex items-center gap-2 pl-2 border-l border-surface-border">
                            <input
                              id={`photo-input-${i.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => setPhotos({ ...photos, [i.id]: e.target.files[0] })}
                              className="text-body-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-surface-container-high file:text-on-surface file:font-medium file:cursor-pointer hover:file:bg-surface-container-high/80 transition-colors"
                            />
                            <button
                              onClick={() => uploadPhoto(i.id)}
                              disabled={!photos[i.id]}
                              className="h-10 px-4 bg-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Camera size={16} />
                              Upload Photo
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {inspections.length === 0 && (
              <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
                <Calendar size={32} className="text-outline mx-auto mb-2" />
                <p className="text-body-md text-on-surface-variant">No inspections scheduled yet.</p>
                <p className="text-body-sm text-outline mt-1">Use the form above to schedule one.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
