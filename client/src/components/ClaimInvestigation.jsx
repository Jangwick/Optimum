import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getInvestigations,
  createInvestigation,
  deleteInvestigation,
  getContacts,
  createContact,
  deleteContact,
  getInspections,
  createInspection,
  updateInspection,
  deleteInspection,
  uploadInspectionPhoto,
  ensureInspection,
  deleteInspectionPhoto,
} from '../services/investigation.service.js';
import {
  getDiscussionNotes,
  createDiscussionNote,
  deleteDiscussionNote,
  getAutoReserve,
} from '../services/discussion-note.service.js';
import { updateClaim } from '../services/claim.service.js';
import { authUrl } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import { Select } from './Select.jsx';
import {
  Search,
  Users,
  Calendar,
  MapPin,
  FileText,
  Camera,
  CheckCircle,
  Plus,
  Trash2,
  X,
  Download,
  MessageSquare,
  DollarSign,
  Calculator,
  Upload,
  User,
  Building2,
} from 'lucide-react';

const PARTY_TYPES = [
  { value: 'INSURED', label: 'Insured', icon: User },
  { value: 'INSURER', label: 'Insurer', icon: Building2 },
  { value: 'BROKER', label: 'Broker', icon: Users },
  { value: 'INTERNAL', label: 'Internal', icon: FileText },
];

export default function ClaimInvestigation({ claimId, claim, onClaimChange }) {
  const [tab, setTab] = useState('notes');
  const [investigations, setInvestigations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [notes, setNotes] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  const load = useCallback(async () => {
    const [inv, con, ins, dn] = await Promise.all([
      getInvestigations(claimId),
      getContacts(claimId),
      getInspections(claimId),
      getDiscussionNotes(claimId),
    ]);
    setInvestigations(inv.items || []);
    setContacts(con.items || []);
    setInspections(ins.items || []);
    setNotes(dn.items || []);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, refresh, load]);

  const triggerRefresh = () => {
    setRefresh((r) => r + 1);
    onClaimChange?.();
  };

  // ─── Investigation form state ───
  const [invForm, setInvForm] = useState({ findings: '', notes: '' });
  const [conForm, setConForm] = useState({ name: '', role: '', phone: '', email: '' });
  const [inspForm, setInspForm] = useState({ scheduledAt: '', location: '', scope: '', notes: '' });
  const [findings, setFindings] = useState({});
  const [noteForm, setNoteForm] = useState({
    partyType: 'INSURED',
    partyName: '',
    discussedAt: new Date().toISOString().slice(0, 16),
    notes: '',
    nextAction: '',
  });
  const [savingNote, setSavingNote] = useState(false);
  const [reserveValue, setReserveValue] = useState(claim?.estimatedLoss || '');
  const [suggestion, setSuggestion] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [savingReserve, setSavingReserve] = useState(false);
  const [reserveSaved, setReserveSaved] = useState(false);

  useEffect(() => {
    setReserveValue(claim?.estimatedLoss || '');
  }, [claim, refresh]);

  // ─── Handlers ───
  const saveInvestigation = async (e) => {
    e.preventDefault();
    await createInvestigation(claimId, invForm);
    setInvForm({ findings: '', notes: '' });
    triggerRefresh();
  };

  const removeInvestigation = async (id) => {
    if (!confirm('Delete this investigation?')) return;
    await deleteInvestigation(claimId, id);
    triggerRefresh();
  };

  const saveContact = async (e) => {
    e.preventDefault();
    await createContact(claimId, conForm);
    setConForm({ name: '', role: '', phone: '', email: '' });
    triggerRefresh();
  };

  const removeContact = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await deleteContact(claimId, id);
    triggerRefresh();
  };

  const saveInspection = async (e) => {
    e.preventDefault();
    await createInspection(claimId, { ...inspForm, scheduledAt: inspForm.scheduledAt ? new Date(inspForm.scheduledAt).toISOString() : null });
    setInspForm({ scheduledAt: '', location: '', scope: '', notes: '' });
    triggerRefresh();
  };

  const completeInspection = async (id) => {
    await updateInspection(claimId, id, { findings: findings[id] || '', conductedAt: new Date().toISOString() });
    setFindings({ ...findings, [id]: '' });
    triggerRefresh();
  };

  const removeInspection = async (id) => {
    if (!confirm('Delete this inspection and all its photos?')) return;
    await deleteInspection(claimId, id);
    triggerRefresh();
  };

  const fileInputRefs = useRef({});

  const handleFileSelect = async (inspectionId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadInspectionPhoto(claimId, inspectionId, file, 'Inspection photo');
    e.target.value = '';
    triggerRefresh();
  };

  const triggerFileInput = (inspectionId) => {
    fileInputRefs.current[inspectionId]?.click();
  };

  // ─── Discussion Note handlers ───
  const saveNote = async (e) => {
    e.preventDefault();
    if (!noteForm.notes.trim()) return;
    setSavingNote(true);
    try {
      await createDiscussionNote(claimId, {
        ...noteForm,
        discussedAt: noteForm.discussedAt ? new Date(noteForm.discussedAt).toISOString() : new Date().toISOString(),
      });
      setNoteForm({ partyType: 'INSURED', partyName: '', discussedAt: new Date().toISOString().slice(0, 16), notes: '', nextAction: '' });
      triggerRefresh();
    } finally {
      setSavingNote(false);
    }
  };

  const removeNote = async (id) => {
    if (!confirm('Delete this discussion note?')) return;
    await deleteDiscussionNote(claimId, id);
    triggerRefresh();
  };

  // ─── Reserve handlers ───
  const calculateReserve = async () => {
    setCalculating(true);
    try {
      const result = await getAutoReserve(claimId);
      setSuggestion(result);
      setReserveValue(result.suggestedReserve);
      setReserveSaved(false);
    } finally {
      setCalculating(false);
    }
  };

  const saveReserve = async (e) => {
    e.preventDefault();
    const value = Number(reserveValue);
    if (Number.isNaN(value)) return;
    setSavingReserve(true);
    setReserveSaved(false);
    try {
      await updateClaim(claimId, { estimatedLoss: value, reserve: value });
      setReserveSaved(true);
      triggerRefresh();
    } finally {
      setSavingReserve(false);
    }
  };

  // ─── Photos step (all photos across inspections) ───
  const [uploading, setUploading] = useState(false);
  const photosFileRef = useRef(null);

  const allPhotos = inspections.flatMap((insp) =>
    (insp.photos || []).map((photo) => ({ ...photo, inspectionId: insp.id }))
  );

  const handlePhotosUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const inspection = await ensureInspection(claimId);
      for (const file of files) {
        await uploadInspectionPhoto(claimId, inspection.id, file, '');
      }
      triggerRefresh();
    } finally {
      setUploading(false);
      if (photosFileRef.current) photosFileRef.current.value = '';
    }
  };

  const handlePhotosDrop = (e) => {
    e.preventDefault();
    handlePhotosUpload(e.dataTransfer.files);
  };

  const removePhoto = async (photo) => {
    if (!confirm('Delete this photo?')) return;
    await deleteInspectionPhoto(claimId, photo.id);
    triggerRefresh();
  };

  const partyMeta = (type) => PARTY_TYPES.find((p) => p.value === type) || PARTY_TYPES[3];

  const tabs = [
    { key: 'notes', label: 'Discussion Notes', icon: MessageSquare, count: notes.length },
    { key: 'reserve', label: 'Loss Reserve', icon: DollarSign },
    { key: 'investigations', label: 'Investigations', icon: Search, count: investigations.length },
    { key: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
    { key: 'inspections', label: 'Site Inspections', icon: Calendar, count: inspections.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-surface-border overflow-x-auto">
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
            {t.count != null && t.count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded text-label-sm font-medium ${tab === t.key ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab: Discussion Notes ─── */}
      {tab === 'notes' && (
        <div className="space-y-6">
          <form onSubmit={saveNote} className="bg-surface border border-surface-border rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Add Discussion Note</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Party Type</label>
                <Select
                  value={noteForm.partyType}
                  onChange={(v) => setNoteForm({ ...noteForm, partyType: v })}
                  options={PARTY_TYPES.map((p) => ({ value: p.value, label: p.label }))}
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Party Name</label>
                <input
                  type="text"
                  value={noteForm.partyName}
                  onChange={(e) => setNoteForm({ ...noteForm, partyName: e.target.value })}
                  placeholder="Name of person contacted"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={noteForm.discussedAt}
                  onChange={(e) => setNoteForm({ ...noteForm, discussedAt: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Next Action</label>
                <input
                  type="text"
                  value={noteForm.nextAction}
                  onChange={(e) => setNoteForm({ ...noteForm, nextAction: e.target.value })}
                  placeholder="Agreed next step..."
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <textarea
                value={noteForm.notes}
                onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                placeholder="Discussion details..."
                rows={3}
                required
                className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingNote || !noteForm.notes.trim()}
              className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {savingNote ? 'Saving...' : 'Add Note'}
            </button>
          </form>

          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="bg-surface border border-surface-border rounded-lg p-8 text-center">
                <MessageSquare size={32} className="mx-auto text-outline mb-3" />
                <p className="text-body-md text-on-surface-variant">No discussion notes yet. Add the first one above.</p>
              </div>
            ) : (
              notes.map((note) => {
                const meta = partyMeta(note.partyType);
                const Icon = meta.icon;
                return (
                  <div key={note.id} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Icon size={16} />
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-label-md font-medium bg-primary/10 text-primary">
                            {meta.label}
                          </span>
                          {note.partyName && (
                            <span className="ml-2 text-body-sm font-medium text-on-surface">{note.partyName}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeNote(note.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-body-sm text-on-surface">{note.notes}</p>
                      {note.nextAction && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Next Action</span>
                          <p className="text-body-sm text-on-surface-variant mt-0.5">{note.nextAction}</p>
                        </div>
                      )}
                      <p className="text-label-sm text-outline font-mono pt-1 border-t border-surface-border">
                        {new Date(note.discussedAt).toLocaleString()} · {note.createdBy ? `${note.createdBy.firstName} ${note.createdBy.lastName}` : 'System'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Loss Reserve ─── */}
      {tab === 'reserve' && (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Loss Reserve</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-container-low rounded-lg p-4">
              <span className="text-label-md text-outline uppercase">Current Estimated Loss</span>
              <p className="text-headline-md font-mono text-on-surface mt-1">{formatCurrency(claim?.estimatedLoss)}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4">
              <span className="text-label-md text-outline uppercase">Current Reserve</span>
              <p className="text-headline-md font-mono text-on-surface mt-1">{formatCurrency(claim?.reserve)}</p>
            </div>
          </div>

          <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-body-md font-medium text-primary">Auto-Calculate Reserve</p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Suggests a reserve based on assessment data, claimed amount, or estimated loss.
                </p>
              </div>
              <button
                onClick={calculateReserve}
                disabled={calculating}
                className="h-10 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-60"
              >
                <Calculator size={16} />
                {calculating ? 'Calculating...' : 'Calculate'}
              </button>
            </div>
            {suggestion && (
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-label-md text-outline uppercase">Basis</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-label-md font-medium bg-primary/10 text-primary capitalize">
                    {suggestion.basis}
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant font-mono mt-1">{suggestion.calculation}</p>
              </div>
            )}
          </div>

          <form onSubmit={saveReserve} className="space-y-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Loss Reserved Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={reserveValue}
                  onChange={(e) => { setReserveValue(e.target.value); setReserveSaved(false); }}
                  className="w-full h-10 pl-8 pr-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  placeholder="0.00"
                />
              </div>
              <p className="text-body-sm text-outline mt-1">
                This value is saved to both Estimated Loss and Reserve fields.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {reserveSaved && (
                <span className="inline-flex items-center gap-1 text-body-sm text-success-green font-medium">
                  <CheckCircle size={16} />
                  Saved
                </span>
              )}
              <button
                type="submit"
                disabled={savingReserve}
                className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-60"
              >
                <DollarSign size={16} />
                {savingReserve ? 'Saving...' : 'Save Reserve'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Tab: Investigations ─── */}
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

      {/* ─── Tab: Contacts ─── */}
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

      {/* ─── Tab: Site Inspections ─── */}
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
                              ref={(el) => (fileInputRefs.current[i.id] = el)}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileSelect(i.id, e)}
                              className="hidden"
                            />
                            <button
                              onClick={() => triggerFileInput(i.id)}
                              className="h-10 px-4 bg-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
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

          {/* Drag & drop photo upload — adds photos to the latest inspection */}
          <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Inspection Photos</h3>
            </div>
            <div
              onDrop={handlePhotosDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-outline rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => photosFileRef.current?.click()}
            >
              <input
                ref={photosFileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handlePhotosUpload(e.target.files)}
                className="hidden"
              />
              <Upload size={32} className="mx-auto text-outline mb-3" />
              <p className="text-body-md text-on-surface-variant">
                {uploading ? 'Uploading...' : 'Click or drag photos here to upload'}
              </p>
              <p className="text-body-sm text-outline mt-1">Site, document, and evidence photos</p>
            </div>

            {allPhotos.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {allPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="bg-surface-container-high p-2 rounded-lg text-center border border-surface-border hover:border-primary hover:shadow-md transition-all group"
                    >
                      <div className="relative w-full aspect-square rounded overflow-hidden bg-surface-container-high mb-1 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setViewingPhoto(photo)}
                          className="w-full h-full block cursor-zoom-in"
                          title={`View ${photo.originalName}`}
                        >
                          <img
                            src={authUrl(`/api/claims/${claimId}/inspections/photos/${photo.id}`)}
                            alt={photo.originalName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                          <div style={{ display: 'none' }} className="w-full h-full items-center justify-center">
                            <Camera size={24} className="text-on-surface-variant" />
                          </div>
                        </button>
                        <button
                          onClick={() => removePhoto(photo)}
                          className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-error/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-label-sm truncate" title={photo.originalName}>{photo.originalName}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-body-sm text-success-green font-medium pt-2 border-t border-surface-border">
                  <CheckCircle size={16} />
                  {allPhotos.length} {allPhotos.length === 1 ? 'photo' : 'photos'} uploaded
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Photo Viewer Lightbox */}
      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div
            className="bg-surface rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="min-w-0">
                <p className="text-body-md font-semibold text-on-surface truncate">{viewingPhoto.originalName}</p>
                {viewingPhoto.caption && (
                  <p className="text-body-sm text-on-surface-variant truncate">{viewingPhoto.caption}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={authUrl(`/api/claims/${claimId}/inspections/photos/${viewingPhoto.id}`)}
                  download={viewingPhoto.originalName}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </a>
                <button
                  onClick={() => setViewingPhoto(null)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 bg-surface-container-low flex items-center justify-center max-h-[70vh]">
              <img
                src={authUrl(`/api/claims/${claimId}/inspections/photos/${viewingPhoto.id}`)}
                alt={viewingPhoto.originalName}
                className="max-w-full max-h-[65vh] rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
