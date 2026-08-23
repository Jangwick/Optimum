import { useEffect, useState, useCallback, useRef } from 'react';
import {
  MessageSquare,
  DollarSign,
  Camera,
  Plus,
  Trash2,
  CheckCircle,
  Calculator,
  Upload,
  ArrowRight,
  Users,
  Building2,
  User,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '../utils/currency.js';
import {
  getDiscussionNotes,
  createDiscussionNote,
  deleteDiscussionNote,
  getAutoReserve,
} from '../services/discussion-note.service.js';
import { updateClaim } from '../services/claim.service.js';
import {
  getInspections,
  ensureInspection,
  uploadInspectionPhoto,
  deleteInspectionPhoto,
} from '../services/investigation.service.js';

const PARTY_TYPES = [
  { value: 'INSURED', label: 'Insured', icon: User },
  { value: 'INSURER', label: 'Insurer', icon: Building2 },
  { value: 'BROKER', label: 'Broker', icon: Users },
  { value: 'INTERNAL', label: 'Internal', icon: FileText },
];

const STEPS = [
  { key: 'notes', label: 'Discussion Notes', icon: MessageSquare },
  { key: 'reserve', label: 'Loss Reserve', icon: DollarSign },
  { key: 'photos', label: 'Investigation Photos', icon: Camera },
];

export default function InitialInvestigation({ claimId, claim, onClaimChange }) {
  const [step, setStep] = useState(0);
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === idx;
            const isDone = step > idx;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => setStep(idx)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : isDone
                      ? 'text-success-green hover:bg-success-green/5'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-label-md font-semibold ${
                      isActive
                        ? 'bg-primary text-white'
                        : isDone
                        ? 'bg-success-green/10 text-success-green'
                        : 'bg-surface-container-high text-outline'
                    }`}
                  >
                    {isDone ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                  <Icon size={16} className="sm:hidden" />
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px ${isDone ? 'bg-success-green/30' : 'bg-surface-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {step === 0 && (
        <DiscussionNotesStep claimId={claimId} refresh={refresh} onChanged={() => { setRefresh((r) => r + 1); onClaimChange?.(); }} onNext={() => setStep(1)} />
      )}
      {step === 1 && (
        <ReserveStep claimId={claimId} claim={claim} refresh={refresh} onChanged={() => { setRefresh((r) => r + 1); onClaimChange?.(); }} onNext={() => setStep(2)} onBack={() => setStep(0)} />
      )}
      {step === 2 && (
        <PhotosStep claimId={claimId} refresh={refresh} onChanged={() => { setRefresh((r) => r + 1); onClaimChange?.(); }} onBack={() => setStep(1)} />
      )}
    </div>
  );
}

// ─── Step 1: Discussion Notes ───
function DiscussionNotesStep({ claimId, refresh, onChanged, onNext }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    partyType: 'INSURED',
    partyName: '',
    discussedAt: new Date().toISOString().slice(0, 16),
    notes: '',
    nextAction: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDiscussionNotes(claimId);
      setNotes(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [load, refresh]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.notes.trim()) return;
    setSaving(true);
    try {
      await createDiscussionNote(claimId, {
        ...form,
        discussedAt: form.discussedAt ? new Date(form.discussedAt).toISOString() : new Date().toISOString(),
      });
      setForm({ partyType: 'INSURED', partyName: '', discussedAt: new Date().toISOString().slice(0, 16), notes: '', nextAction: '' });
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this discussion note?')) return;
    await deleteDiscussionNote(claimId, id);
    onChanged();
  };

  const partyMeta = (type) => PARTY_TYPES.find((p) => p.value === type) || PARTY_TYPES[3];

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={save} className="bg-surface border border-surface-border rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">Add Discussion Note</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Party Type</label>
            <select
              value={form.partyType}
              onChange={(e) => setForm({ ...form, partyType: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            >
              {PARTY_TYPES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Party Name</label>
            <input
              type="text"
              value={form.partyName}
              onChange={(e) => setForm({ ...form, partyName: e.target.value })}
              placeholder="Name of person contacted"
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Date & Time</label>
            <input
              type="datetime-local"
              value={form.discussedAt}
              onChange={(e) => setForm({ ...form, discussedAt: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Next Action</label>
            <input
              type="text"
              value={form.nextAction}
              onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
              placeholder="Agreed next step..."
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Discussion details..."
            rows={3}
            required
            className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={saving || !form.notes.trim()}
            className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            {saving ? 'Saving...' : 'Add Note'}
          </button>
          {notes.length > 0 && (
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1 text-body-sm text-primary font-medium hover:text-primary-container transition-colors"
            >
              Continue to Reserve
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-surface border border-surface-border rounded-lg p-8 text-center text-on-surface-variant">Loading...</div>
        ) : notes.length === 0 ? (
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
                    onClick={() => remove(note.id)}
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
  );
}

// ─── Step 2: Loss Reserve ───
function ReserveStep({ claimId, claim, refresh, onChanged, onNext, onBack }) {
  const [reserveValue, setReserveValue] = useState(claim?.estimatedLoss || '');
  const [suggestion, setSuggestion] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setReserveValue(claim?.estimatedLoss || '');
  }, [claim, refresh]);

  const calculate = async () => {
    setCalculating(true);
    try {
      const result = await getAutoReserve(claimId);
      setSuggestion(result);
      setReserveValue(result.suggestedReserve);
      setSaved(false);
    } finally {
      setCalculating(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const value = Number(reserveValue);
    if (Number.isNaN(value)) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateClaim(claimId, { estimatedLoss: value, reserve: value });
      setSaved(true);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">Loss Reserve</h3>
        </div>

        {/* Current values */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-low rounded-lg p-4">
            <span className="text-label-md text-outline uppercase">Current Estimated Loss</span>
            <p className="text-headline-md font-mono text-on-surface mt-1">{formatCurrency(claim?.estimatedLoss)}</p>
          </div>
          <div className="bg-surface-container-low rounded-lg p-4">
            <span className="text-label-md text-outline uppercase">Current Reserve</span>
            <p className="text-headline-md font-mono text-on-surface mt-1">{formatCurrency(claim?.reserve)}</p>
          </div>
        </div>

        {/* Auto-calculate */}
        <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-body-md font-medium text-primary">Auto-Calculate Reserve</p>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Suggests a reserve based on assessment data, claimed amount, or estimated loss.
              </p>
            </div>
            <button
              onClick={calculate}
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

        {/* Edit + Save */}
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Loss Reserved Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-mono">₱</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={reserveValue}
                onChange={(e) => { setReserveValue(e.target.value); setSaved(false); }}
                className="w-full h-10 pl-8 pr-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                placeholder="0.00"
              />
            </div>
            <p className="text-body-sm text-outline mt-1">
              This value is saved to both Estimated Loss and Reserve fields.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="text-body-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              ← Back to Notes
            </button>
            <div className="flex items-center gap-3">
              {saved && (
                <span className="inline-flex items-center gap-1 text-body-sm text-success-green font-medium">
                  <CheckCircle size={16} />
                  Saved
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-60"
              >
                <DollarSign size={16} />
                {saving ? 'Saving...' : 'Save Reserve'}
              </button>
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-1 text-body-sm text-primary font-medium hover:text-primary-container transition-colors"
              >
                Continue to Photos
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Step 3: Investigation Photos ───
function PhotosStep({ claimId, refresh, onChanged, onBack }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [captions, setCaptions] = useState({});
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInspections(claimId);
      setInspections(data.items || []);
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [load, refresh]);

  const allPhotos = inspections.flatMap((insp) =>
    (insp.photos || []).map((photo) => ({ ...photo, inspectionId: insp.id }))
  );

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const inspection = await ensureInspection(claimId);
      for (const file of files) {
        const caption = captions[file.name] || '';
        await uploadInspectionPhoto(claimId, inspection.id, file, caption);
      }
      setCaptions({});
      onChanged();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = async (photo) => {
    if (!confirm('Delete this photo?')) return;
    await deleteInspectionPhoto(claimId, photo.id);
    onChanged();
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">Investigation Photos</h3>
        </div>

        {/* Upload area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-outline rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <Upload size={32} className="mx-auto text-outline mb-3" />
          <p className="text-body-md text-on-surface-variant">
            {uploading ? 'Uploading...' : 'Click or drag photos here to upload'}
          </p>
          <p className="text-body-sm text-outline mt-1">Site, document, and evidence photos</p>
        </div>

        {/* Photo grid */}
        {loading ? (
          <div className="text-center py-8 text-on-surface-variant">Loading...</div>
        ) : allPhotos.length === 0 ? (
          <div className="text-center py-8">
            <Camera size={32} className="mx-auto text-outline mb-3" />
            <p className="text-body-md text-on-surface-variant">No photos uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPhotos.map((photo) => (
              <figure key={photo.id} className="border border-surface-border rounded-lg overflow-hidden bg-surface">
                <div className="relative group">
                  <img
                    src={`/api/claims/${claimId}/inspections/photos/${photo.id}`}
                    alt={photo.originalName}
                    className="w-full h-48 object-cover bg-surface-container-high"
                  />
                  <button
                    onClick={() => removePhoto(photo)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-error/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete photo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <figcaption className="p-3 text-body-sm">
                  <p className="font-medium text-on-surface break-words">{photo.originalName}</p>
                  {photo.caption && <p className="text-on-surface-variant mt-1">{photo.caption}</p>}
                  <p className="text-label-sm text-outline mt-1 font-mono">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-surface-border">
          <button
            type="button"
            onClick={onBack}
            className="text-body-sm text-on-surface-variant hover:text-primary transition-colors"
          >
            ← Back to Reserve
          </button>
          {allPhotos.length > 0 && (
            <span className="inline-flex items-center gap-1 text-body-sm text-success-green font-medium">
              <CheckCircle size={16} />
              {allPhotos.length} {allPhotos.length === 1 ? 'photo' : 'photos'} uploaded
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
