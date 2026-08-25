import { useEffect, useState, useCallback, useRef, type FormEvent, type ChangeEvent, type DragEvent, type MouseEvent, type SyntheticEvent } from 'react';
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
  deleteInspectionPhoto,
} from '../services/investigation.service.js';
import {
  getDiscussionNotes,
  createDiscussionNote,
  deleteDiscussionNote,
  getAutoReserve,
} from '../services/discussion-note.service.js';
import { updateClaim } from '../services/claim.service.js';
import { SecureImage } from './SecureImage.jsx';
import { SecureDownloadLink } from './SecureDownloadLink.jsx';
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
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

// LIMIT: this should be shared from server config
const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface PartyType {
  value: string;
  label: string;
  icon: LucideIcon;
}

const PARTY_TYPES: PartyType[] = [
  { value: 'INSURED', label: 'Insured', icon: User },
  { value: 'INSURER', label: 'Insurer', icon: Building2 },
  { value: 'BROKER', label: 'Broker', icon: Users },
  { value: 'INTERNAL', label: 'Internal', icon: FileText },
];

interface TabDef {
  key: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface ClaimInvestigationProps {
  claimId: string | number;
  claim?: Record<string, unknown>;
  onClaimChange?: () => void;
}

export default function ClaimInvestigation({ claimId, claim, onClaimChange }: ClaimInvestigationProps) {
  const [tab, setTab] = useState<string>('notes');
  const [investigations, setInvestigations] = useState<Record<string, unknown>[]>([]);
  const [contacts, setContacts] = useState<Record<string, unknown>[]>([]);
  const [inspections, setInspections] = useState<Record<string, unknown>[]>([]);
  const [notes, setNotes] = useState<Record<string, unknown>[]>([]);
  const [refresh, setRefresh] = useState<number>(0);
  const [viewingPhoto, setViewingPhoto] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    const [inv, con, ins, dn] = await Promise.all([
      getInvestigations(claimId),
      getContacts(claimId),
      getInspections(claimId),
      getDiscussionNotes(claimId),
    ]);
    const invData = inv as Record<string, unknown>;
    const conData = con as Record<string, unknown>;
    const insData = ins as Record<string, unknown>;
    const dnData = dn as Record<string, unknown>;
    setInvestigations((invData.items as Record<string, unknown>[] | undefined) ?? []);
    setContacts((conData.items as Record<string, unknown>[] | undefined) ?? []);
    setInspections((insData.items as Record<string, unknown>[] | undefined) ?? []);
    setNotes((dnData.items as Record<string, unknown>[] | undefined) ?? []);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, refresh, load]);

  const triggerRefresh = () => {
    setRefresh((r) => r + 1);
    onClaimChange?.();
  };

  // ─── Investigation form state ───
  const [invForm, setInvForm] = useState<Record<string, string>>({ findings: '', notes: '' });
  const [conForm, setConForm] = useState<Record<string, string>>({ name: '', role: '', phone: '', email: '' });
  const [inspForm, setInspForm] = useState<Record<string, string>>({
    scheduledAt: '',
    location: '',
    scope: '',
    notes: '',
  });
  const [inspPhotos, setInspPhotos] = useState<File[]>([]);
  const inspPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [findings, setFindings] = useState<Record<string, string>>({});
  const [noteForm, setNoteForm] = useState<Record<string, string>>({
    partyType: 'INSURED',
    partyName: '',
    discussedAt: new Date().toISOString().slice(0, 16),
    notes: '',
    nextAction: '',
  });
  const [savingNote, setSavingNote] = useState<boolean>(false);
  const [reserveValue, setReserveValue] = useState<string | number>(
    (claim?.estimatedLoss as string | number | undefined) || '',
  );
  const [suggestion, setSuggestion] = useState<Record<string, unknown> | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [savingReserve, setSavingReserve] = useState<boolean>(false);
  const [reserveSaved, setReserveSaved] = useState<boolean>(false);

  useEffect(() => {
    setReserveValue((claim?.estimatedLoss as string | number | undefined) || '');
  }, [claim, refresh]);

  const [uploading, setUploading] = useState<boolean>(false);

  // ─── Handlers ───
  const saveInvestigation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createInvestigation(claimId, invForm as Record<string, unknown>);
    setInvForm({ findings: '', notes: '' });
    triggerRefresh();
  };

  const removeInvestigation = async (id: string | number) => {
    if (!confirm('Delete this investigation?')) return;
    await deleteInvestigation(claimId, id);
    triggerRefresh();
  };

  const saveContact = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await createContact(claimId, conForm as Record<string, unknown>);
    setConForm({ name: '', role: '', phone: '', email: '' });
    triggerRefresh();
  };

  const removeContact = async (id: string | number) => {
    if (!confirm('Delete this contact?')) return;
    await deleteContact(claimId, id);
    triggerRefresh();
  };

  const saveInspection = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inspPhotos.some((photo) => photo.size > MAX_FILE_SIZE)) {
      toast.error('File too large. Maximum is 20MB.');
      return;
    }
    setUploading(true);
    try {
      const result = await createInspection(claimId, {
        ...inspForm,
        scheduledAt: inspForm.scheduledAt ? new Date(inspForm.scheduledAt).toISOString() : null,
      } as Record<string, unknown>);
      const resultObj = result as Record<string, unknown>;
      const item = resultObj.item as Record<string, unknown> | undefined;
      const inspectionId = (item?.id ?? resultObj.id) as string | number;
      for (const file of inspPhotos) {
        await uploadInspectionPhoto(claimId, inspectionId, file, '');
      }
      setInspForm({ scheduledAt: '', location: '', scope: '', notes: '' });
      setInspPhotos([]);
      if (inspPhotoInputRef.current) inspPhotoInputRef.current.value = '';
      triggerRefresh();
    } finally {
      setUploading(false);
    }
  };

  const completeInspection = async (id: string | number) => {
    await updateInspection(claimId, id, {
      findings: findings[id as string] || '',
      conductedAt: new Date().toISOString(),
    } as Record<string, unknown>);
    setFindings({ ...findings, [id as string]: '' });
    triggerRefresh();
  };

  const removeInspection = async (id: string | number) => {
    if (!confirm('Delete this inspection and all its photos?')) return;
    await deleteInspection(claimId, id);
    triggerRefresh();
  };

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = async (inspectionId: string | number, e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    if (fileList.some((file) => file.size > MAX_FILE_SIZE)) {
      toast.error('File too large. Maximum is 20MB.');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      for (const file of fileList) {
        await uploadInspectionPhoto(claimId, inspectionId, file, '');
      }
      e.target.value = '';
      triggerRefresh();
    } finally {
      setUploading(false);
    }
  };

  const handleInspectionDrop = async (inspectionId: string | number, e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    if (fileList.some((file) => file.size > MAX_FILE_SIZE)) {
      toast.error('File too large. Maximum is 20MB.');
      return;
    }
    setUploading(true);
    try {
      for (const file of fileList) {
        await uploadInspectionPhoto(claimId, inspectionId, file, '');
      }
      triggerRefresh();
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = (inspectionId: string | number) => {
    fileInputRefs.current[inspectionId as string]?.click();
  };

  // ─── Discussion Note handlers ───
  const saveNote = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!noteForm.notes?.trim()) return;
    setSavingNote(true);
    try {
      await createDiscussionNote(claimId, {
        ...noteForm,
        discussedAt: noteForm.discussedAt ? new Date(noteForm.discussedAt).toISOString() : new Date().toISOString(),
      } as Record<string, unknown>);
      setNoteForm({
        partyType: 'INSURED',
        partyName: '',
        discussedAt: new Date().toISOString().slice(0, 16),
        notes: '',
        nextAction: '',
      });
      triggerRefresh();
    } finally {
      setSavingNote(false);
    }
  };

  const removeNote = async (id: string | number) => {
    if (!confirm('Delete this discussion note?')) return;
    await deleteDiscussionNote(claimId, id);
    triggerRefresh();
  };

  // ─── Reserve handlers ───
  const calculateReserve = async () => {
    setCalculating(true);
    try {
      const result = (await getAutoReserve(claimId)) as Record<string, unknown>;
      setSuggestion(result);
      setReserveValue((result.suggestedReserve as string | number | null | undefined) ?? '');
      setReserveSaved(false);
    } finally {
      setCalculating(false);
    }
  };

  const saveReserve = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = Number(reserveValue);
    if (Number.isNaN(value)) return;
    setSavingReserve(true);
    setReserveSaved(false);
    try {
      await updateClaim(claimId, { estimatedLoss: value, reserve: value } as Record<string, unknown>);
      setReserveSaved(true);
      triggerRefresh();
    } finally {
      setSavingReserve(false);
    }
  };

  const removePhoto = async (photo: Record<string, unknown>) => {
    if (!confirm('Delete this photo?')) return;
    await deleteInspectionPhoto(claimId, photo.id as string | number);
    triggerRefresh();
  };

  const partyMeta = (type: string) =>
    PARTY_TYPES.find((p) => p.value === type) ?? PARTY_TYPES[3] ?? { value: 'INTERNAL', label: 'Internal', icon: FileText };

  const tabs: TabDef[] = [
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
                  value={noteForm.partyType as string}
                  onChange={(v) => setNoteForm({ ...noteForm, partyType: v as string })}
                  options={PARTY_TYPES.map((p) => ({ value: p.value, label: p.label }))}
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Party Name</label>
                <input
                  type="text"
                  value={noteForm.partyName as string}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNoteForm({ ...noteForm, partyName: e.target.value })}
                  placeholder="Name of person contacted"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Date & Time</label>
                <input
                  type="datetime-local"
                  value={noteForm.discussedAt as string}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNoteForm({ ...noteForm, discussedAt: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Next Action</label>
                <input
                  type="text"
                  value={noteForm.nextAction as string}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNoteForm({ ...noteForm, nextAction: e.target.value })}
                  placeholder="Agreed next step..."
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <textarea
                value={noteForm.notes as string}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNoteForm({ ...noteForm, notes: e.target.value })}
                placeholder="Discussion details..."
                rows={3}
                required
                className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingNote || !noteForm.notes?.trim()}
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
                const meta = partyMeta(note.partyType as string);
                const Icon = meta.icon;
                const createdBy = note.createdBy as Record<string, unknown> | undefined;
                const createdByName = createdBy
                  ? `${createdBy.firstName as string | undefined} ${createdBy.lastName as string | undefined}`
                  : 'System';
                const noteText = note.notes as string | undefined;
                const nextAction = note.nextAction as string | undefined;
                const partyName = note.partyName as string | undefined;
                return (
                  <div key={note.id as string | number} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Icon size={16} />
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-label-md font-medium bg-primary/10 text-primary">
                            {meta.label}
                          </span>
                          {partyName && (
                            <span className="ml-2 text-body-sm font-medium text-on-surface">{partyName}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeNote(note.id as string | number)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="p-3 space-y-2">
                      <p className="text-body-sm text-on-surface">{noteText}</p>
                      {nextAction && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Next Action</span>
                          <p className="text-body-sm text-on-surface-variant mt-0.5">{nextAction}</p>
                        </div>
                      )}
                      <p className="text-label-sm text-outline font-mono pt-1 border-t border-surface-border">
                        {new Date(note.discussedAt as string).toLocaleString()} · {createdByName}
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
              <p className="text-headline-md font-mono text-on-surface mt-1">{formatCurrency(claim?.estimatedLoss as string | number | undefined)}</p>
            </div>
            <div className="bg-surface-container-low rounded-lg p-4">
              <span className="text-label-md text-outline uppercase">Current Reserve</span>
              <p className="text-headline-md font-mono text-on-surface mt-1">{formatCurrency(claim?.reserve as string | number | undefined)}</p>
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
            {suggestion ? (
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-label-md text-outline uppercase">Basis</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-label-md font-medium bg-primary/10 text-primary capitalize">
                    {suggestion.basis as string | undefined}
                  </span>
                </div>
                <p className="text-body-sm text-on-surface-variant font-mono mt-1">{suggestion.calculation as string | undefined}</p>
              </div>
            ) : null}
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setReserveValue(e.target.value); setReserveSaved(false); }}
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
              <textarea value={invForm.findings as string} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInvForm({ ...invForm, findings: e.target.value })} placeholder="Investigation findings..." className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none" rows={3} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <textarea value={invForm.notes as string} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInvForm({ ...invForm, notes: e.target.value })} placeholder="Additional notes..." className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none" rows={2} />
            </div>
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2">
              <Plus size={16} />
              Save Investigation
            </button>
          </form>
          <div className="space-y-3">
            {investigations.map((i) => (
              <div key={i.id as string | number} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <p className="text-body-md font-semibold text-on-surface">Investigation #{i.id as string | number}</p>
                  </div>
                  <button
                    onClick={() => removeInvestigation(i.id as string | number)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                    title="Delete investigation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {!!(i.findings as string | undefined) && (
                    <div>
                      <span className="text-label-md text-outline uppercase">Findings</span>
                      <p className="text-body-sm text-on-surface mt-0.5">{i.findings as string}</p>
                    </div>
                  )}
                  {!!(i.notes as string | undefined) && (
                    <div>
                      <span className="text-label-md text-outline uppercase">Notes</span>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">{i.notes as string}</p>
                    </div>
                  )}
                  <p className="text-label-sm text-outline font-mono pt-1 border-t border-surface-border">{new Date(i.createdAt as string).toLocaleString()}</p>
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
                <input type="text" value={conForm.name as string} onChange={(e: ChangeEvent<HTMLInputElement>) => setConForm({ ...conForm, name: e.target.value })} placeholder="Contact name" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" required />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Role</label>
                <input type="text" value={conForm.role as string} onChange={(e: ChangeEvent<HTMLInputElement>) => setConForm({ ...conForm, role: e.target.value })} placeholder="Role / title" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Phone</label>
                <input type="tel" value={conForm.phone as string} onChange={(e: ChangeEvent<HTMLInputElement>) => setConForm({ ...conForm, phone: e.target.value })} placeholder="Phone number" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Email</label>
                <input type="email" value={conForm.email as string} onChange={(e: ChangeEvent<HTMLInputElement>) => setConForm({ ...conForm, email: e.target.value })} placeholder="Email address" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" />
              </div>
            </div>
            <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2">
              <Plus size={16} />
              Save Contact
            </button>
          </form>
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id as string | number} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-on-surface">{c.name as string}</p>
                      {!!(c.role as string | undefined) && <p className="text-label-sm text-on-surface-variant">{c.role as string}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => removeContact(c.id as string | number)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-3">
                    {!!(c.phone as string | undefined) && (
                      <div>
                        <span className="text-label-md text-outline uppercase">Phone</span>
                        <p className="text-body-sm text-on-surface mt-0.5 font-mono">{c.phone as string}</p>
                      </div>
                    )}
                    {!!(c.email as string | undefined) && (
                      <div>
                        <span className="text-label-md text-outline uppercase">Email</span>
                        <p className="text-body-sm text-on-surface mt-0.5 break-words">{c.email as string}</p>
                      </div>
                    )}
                  </div>
                  {!(c.phone as string | undefined) && !(c.email as string | undefined) && <p className="text-body-sm text-on-surface-variant">No contact details</p>}
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
              <input type="datetime-local" value={inspForm.scheduledAt as string} onChange={(e: ChangeEvent<HTMLInputElement>) => setInspForm({ ...inspForm, scheduledAt: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" required />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Location</label>
              <input type="text" value={inspForm.location as string} onChange={(e: ChangeEvent<HTMLInputElement>) => setInspForm({ ...inspForm, location: e.target.value })} placeholder="Inspection location" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors" />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Scope</label>
              <textarea value={inspForm.scope as string} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInspForm({ ...inspForm, scope: e.target.value })} placeholder="Inspection scope..." className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none" rows={2} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <textarea value={inspForm.notes as string} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInspForm({ ...inspForm, notes: e.target.value })} placeholder="Additional notes..." className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none" rows={2} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Photos</label>
              <div
                onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : []; setInspPhotos((prev) => [...prev, ...files]); }}
                onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
                className="border-2 border-dashed border-outline rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => inspPhotoInputRef.current?.click()}
              >
                <input
                  ref={inspPhotoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { const files = e.target.files ? Array.from(e.target.files) : []; setInspPhotos((prev) => [...prev, ...files]); e.target.value = ''; }}
                  className="hidden"
                />
                <Upload size={24} className="mx-auto text-outline mb-2" />
                <p className="text-body-sm text-on-surface-variant">Click or drag photos here</p>
              </div>
              {inspPhotos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {inspPhotos.map((file, idx) => (
                    <div key={idx} className="relative bg-surface-container-high p-2 rounded-lg border border-surface-border group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setInspPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove"
                      >
                        <X size={12} />
                      </button>
                      <p className="text-label-sm truncate max-w-[80px] mt-1">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" disabled={uploading} className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              <Plus size={16} />
              {uploading ? 'Saving...' : 'Schedule Inspection'}
            </button>
          </form>

          <div className="space-y-4">
            {inspections.map((i) => {
              const isCompleted = !!(i.conductedAt as string | undefined);
              const inspector = i.inspector as Record<string, unknown> | undefined;
              const photos = (i.photos as Record<string, unknown>[] | undefined) ?? [];
              return (
                <div
                  key={i.id as string | number}
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
                          {i.scheduledAt ? new Date(i.scheduledAt as string).toLocaleString() : 'Unscheduled'}
                        </p>
                        <p className="text-label-sm text-outline font-mono mt-0.5">
                          Inspection #{i.id as string | number}
                          {!!inspector && ` · ${inspector.firstName as string | undefined} ${inspector.lastName as string | undefined}`}
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
                        onClick={() => removeInspection(i.id as string | number)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                        title="Delete inspection"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {!!(i.location as string | undefined) && (
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-label-md text-outline uppercase">Location</p>
                            <p className="text-body-sm text-on-surface mt-0.5 break-words">{i.location as string}</p>
                          </div>
                        </div>
                      )}
                      {!!(i.scope as string | undefined) && (
                        <div className="flex items-start gap-2">
                          <Search size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-label-md text-outline uppercase">Scope</p>
                            <p className="text-body-sm text-on-surface mt-0.5 break-words">{i.scope as string}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {!!(i.notes as string | undefined) && (
                      <div className="flex items-start gap-2">
                        <FileText size={16} className="text-on-surface-variant shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-label-md text-outline uppercase">Notes</p>
                          <p className="text-body-sm text-on-surface mt-0.5 break-words">{i.notes as string}</p>
                        </div>
                      </div>
                    )}

                    {isCompleted && !!(i.findings as string | undefined) && (
                      <div className="mt-2 p-3 bg-success/5 border border-success/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle size={14} className="text-success shrink-0" />
                          <span className="text-label-md text-success uppercase font-medium">Findings</span>
                        </div>
                        <p className="text-body-sm text-on-surface">{i.findings as string}</p>
                        <p className="text-label-sm text-outline mt-2 font-mono">
                          Completed: {new Date(i.conductedAt as string).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {!isCompleted && (
                      <div className="mt-2 pt-3 border-t border-surface-border space-y-3">
                        <div>
                          <label className="block text-label-md text-outline uppercase mb-1.5">Completion Findings</label>
                          <textarea
                            value={findings[i.id as string] || ''}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFindings({ ...findings, [i.id as string]: e.target.value })}
                            placeholder="Enter inspection findings..."
                            className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    )}

                    {/* Drag & drop photo upload for this inspection */}
                    <div className="mt-3 pt-3 border-t border-surface-border space-y-3">
                      <div className="flex items-center gap-2">
                        <Camera size={16} className="text-on-surface-variant shrink-0" />
                        <span className="text-label-md text-outline uppercase">Photos {photos.length > 0 ? `(${photos.length})` : ''}</span>
                      </div>
                      <div
                        onDrop={(e: DragEvent<HTMLDivElement>) => handleInspectionDrop(i.id as string | number, e)}
                        onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
                        className="border-2 border-dashed border-outline rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                        onClick={() => triggerFileInput(i.id as string | number)}
                      >
                        <input
                          ref={(el) => { fileInputRefs.current[i.id as string] = el; }}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(i.id as string | number, e)}
                          className="hidden"
                        />
                        <Upload size={24} className="mx-auto text-outline mb-2" />
                        <p className="text-body-sm text-on-surface-variant">
                          {uploading ? 'Uploading...' : 'Click or drag photos here'}
                        </p>
                      </div>
                      {photos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {photos.map((p) => (
                            <div
                              key={p.id as string | number}
                              className="bg-surface-container-high p-2 rounded-lg text-center border border-surface-border hover:border-primary hover:shadow-md transition-all group"
                            >
                              <div className="relative w-full aspect-square rounded overflow-hidden bg-surface-container-high mb-1 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => setViewingPhoto(p)}
                                  className="w-full h-full block cursor-zoom-in"
                                  title={`View ${p.originalName as string | undefined}`}
                                >
                                  <SecureImage
                                    resource={`/api/claims/${claimId}/inspections/photos/${p.id as string | number}`}
                                    alt={p.originalName as string | undefined}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                    onError={(e: SyntheticEvent<HTMLImageElement, Event>) => { e.currentTarget.style.display = 'none'; const fallback = e.currentTarget.nextSibling as HTMLElement | null; if (fallback) fallback.style.display = 'flex'; }}
                                  />
                                  <div style={{ display: 'none' }} className="w-full h-full items-center justify-center">
                                    <Camera size={24} className="text-on-surface-variant" />
                                  </div>
                                </button>
                                <button
                                  onClick={() => removePhoto(p)}
                                  className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-error/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete photo"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <p className="text-label-sm truncate" title={p.originalName as string | undefined}>{p.originalName as string | undefined}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isCompleted && (
                      <div className="mt-3 pt-3 border-t border-surface-border">
                        <button
                          onClick={() => completeInspection(i.id as string | number)}
                          className="h-10 px-4 bg-success text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          Complete Inspection
                        </button>
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

      {/* Photo Viewer Lightbox */}
      {viewingPhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div
            className="bg-surface rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="min-w-0">
                <p className="text-body-md font-semibold text-on-surface truncate">{viewingPhoto.originalName as string | undefined}</p>
                {!!(viewingPhoto.caption as string | undefined) && (
                  <p className="text-body-sm text-on-surface-variant truncate">{viewingPhoto.caption as string}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SecureDownloadLink
                  resource={`/api/claims/${claimId}/inspections/photos/${viewingPhoto.id as string | number}`}
                  download={viewingPhoto.originalName as string | undefined}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  title="Download"
                >
                  <Download size={18} />
                </SecureDownloadLink>
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
              <SecureImage
                resource={`/api/claims/${claimId}/inspections/photos/${viewingPhoto.id as string | number}`}
                alt={viewingPhoto.originalName as string | undefined}
                className="max-w-full max-h-[65vh] rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
