import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { updateClaim } from '../services/claim.service.js';
import { getPolicies, getClaimTypes, getInsuranceCompanies, getClients } from '../services/master-data.service.js';
import { getUsers } from '../services/user.service.js';
import { Modal } from './Modal.jsx';
import { Select } from './Select.jsx';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { AxiosError } from 'axios';

interface EditClaimModalProps {
  open: boolean;
  onClose: () => void;
  claim: Record<string, unknown> | null;
  onSaved?: (item?: Record<string, unknown>) => void;
}

interface ClaimForm {
  [key: string]: string;
  claimNumber: string;
  assignmentNumber: string;
  insurerClaimNumber: string;
  clientId: string;
  insuranceCompanyId: string;
  claimTypeId: string;
  policyId: string;
  brokerReference: string;
  assignedByName: string;
  handlingAdjuster: string;
  policyNumber: string;
  policyType: string;
  natureOfLoss: string;
  locationOfLoss: string;
  description: string;
  dateOfLoss: string;
  dateInspected: string;
  letterRequestDate: string;
  denialLetterDate: string;
  policyPeriodText: string;
  policyCoverageText: string;
  lossReserved: string;
  claimedAmount: string;
  engineerId: string;
  accountantId: string;
}

const EMPTY_FORM: ClaimForm = {
  claimNumber: '',
  assignmentNumber: '',
  insurerClaimNumber: '',
  clientId: '',
  insuranceCompanyId: '',
  claimTypeId: '',
  policyId: '',
  brokerReference: '',
  assignedByName: '',
  handlingAdjuster: '',
  policyNumber: '',
  policyType: '',
  natureOfLoss: '',
  locationOfLoss: '',
  description: '',
  dateOfLoss: '',
  dateInspected: '',
  letterRequestDate: '',
  denialLetterDate: '',
  policyPeriodText: '',
  policyCoverageText: '',
  lossReserved: '',
  claimedAmount: '',
  engineerId: '',
  accountantId: '',
};

export function EditClaimModal({ open, onClose, claim, onSaved }: EditClaimModalProps) {
  const [policies, setPolicies] = useState<Record<string, unknown>[]>([]);
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [claimTypes, setClaimTypes] = useState<Record<string, unknown>[]>([]);
  const [insurers, setInsurers] = useState<Record<string, unknown>[]>([]);
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClaimForm>(EMPTY_FORM);

  useEffect(() => {
    if (!open || !claim) return;
    setLoading(true);
    setError(null);
    setForm({
      claimNumber: String((claim['claimNumber'] as string | number | undefined) || ''),
      assignmentNumber: String((claim['assignmentNumber'] as string | number | undefined) || ''),
      insurerClaimNumber: String((claim['insurerClaimNumber'] as string | number | undefined) || ''),
      clientId: String((claim['clientId'] as string | number | undefined) || ''),
      insuranceCompanyId: String((claim['insuranceCompanyId'] as string | number | undefined) || ''),
      claimTypeId: String((claim['claimTypeId'] as string | number | undefined) || ''),
      policyId: String((claim['policyId'] as string | number | undefined) || ''),
      brokerReference: String((claim['brokerReference'] as string | number | undefined) || ''),
      assignedByName: String((claim['assignedByName'] as string | number | undefined) || ''),
      handlingAdjuster: String((claim['handlingAdjuster'] as string | number | undefined) || ''),
      policyNumber: String((claim['policyNumber'] as string | number | undefined) || ''),
      policyType: String((claim['policyType'] as string | number | undefined) || ''),
      natureOfLoss: String((claim['natureOfLoss'] as string | number | undefined) || ''),
      locationOfLoss: String((claim['locationOfLoss'] as string | number | undefined) || ''),
      description: String((claim['description'] as string | number | undefined) || ''),
      dateOfLoss: (() => {
        const d = claim['dateOfLoss'] as string | number | Date | undefined;
        return d ? new Date(d).toISOString().slice(0, 10) : '';
      })(),
      dateInspected: (() => {
        const d = claim['dateInspected'] as string | number | Date | undefined;
        return d ? new Date(d).toISOString().slice(0, 10) : '';
      })(),
      letterRequestDate: (() => {
        const d = claim['letterRequestDate'] as string | number | Date | undefined;
        return d ? new Date(d).toISOString().slice(0, 10) : '';
      })(),
      denialLetterDate: (() => {
        const d = claim['denialLetterDate'] as string | number | Date | undefined;
        return d ? new Date(d).toISOString().slice(0, 10) : '';
      })(),
      policyPeriodText: String((claim['policyPeriodText'] as string | number | undefined) || ''),
      policyCoverageText: String((claim['policyCoverageText'] as string | number | undefined) || ''),
      lossReserved: String(
        (claim['estimatedLoss'] as string | number | undefined) ||
          (claim['reserve'] as string | number | undefined) ||
          ''
      ),
      claimedAmount: String((claim['claimedAmount'] as string | number | undefined) || ''),
      engineerId: String((claim['engineerId'] as string | number | undefined) || ''),
      accountantId: String((claim['accountantId'] as string | number | undefined) || ''),
    });
    Promise.all([getPolicies(), getUsers(), getClaimTypes(), getInsuranceCompanies(), getClients()])
      .then(([policiesData, usersData, claimTypesData, insurersData, clientsData]) => {
        setPolicies(
          ((policiesData as Record<string, unknown>).items as Record<string, unknown>[] | undefined) ?? []
        );
        setUsers(
          ((usersData as Record<string, unknown>).users as Record<string, unknown>[] | undefined) ?? []
        );
        setClaimTypes(
          ((claimTypesData as Record<string, unknown>).items as Record<string, unknown>[] | undefined) ?? []
        );
        setInsurers(
          ((insurersData as Record<string, unknown>).items as Record<string, unknown>[] | undefined) ?? []
        );
        setClients(
          ((clientsData as Record<string, unknown>).items as Record<string, unknown>[] | undefined) ?? []
        );
      })
      .catch(() => setError('Failed to load reference data'))
      .finally(() => setLoading(false));
  }, [open, claim]);

  const employees = users.filter(
    (u) => (u['role'] as string) === 'ENGINEER' || (u['role'] as string) === 'ACCOUNTANT'
  );

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload: Record<string, unknown> = { ...form };
    const lossReserved = form.lossReserved ? Number(form.lossReserved) : 0;
    payload['estimatedLoss'] = lossReserved;
    payload['reserve'] = lossReserved;
    delete payload['lossReserved'];
    payload['claimedAmount'] = form.claimedAmount ? Number(form.claimedAmount) : 0;
    ['policyId', 'engineerId', 'accountantId', 'clientId', 'insuranceCompanyId', 'claimTypeId'].forEach((k) => {
      const value = form[k];
      payload[k] = value ? Number(value) : null;
    });
    try {
      const res = await updateClaim(claim!['id'] as string | number, payload);
      const saved = (res as Record<string, unknown>).item as Record<string, unknown> | undefined;
      onSaved?.(saved);
      onClose();
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data as Record<string, unknown> | undefined)?.['error'] as string | undefined)
          : undefined;
      setError(message ?? 'Failed to update claim');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors';

  return (
    <Modal open={open} onClose={onClose} title="Edit Claim" size="xl">
      {error && (
        <div className="mb-4 bg-error/10 border border-error/30 text-error rounded-lg p-3 text-body-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-body-md text-on-surface-variant">Loading reference data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Registry */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Registry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">OCS Ref. No.</label>
              <input type="text" value={form.claimNumber} onChange={set('claimNumber')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Assignment #</label>
              <input
                type="text"
                value={form.assignmentNumber}
                onChange={set('assignmentNumber')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Insurer&apos;s Claim No.</label>
              <input
                type="text"
                value={form.insurerClaimNumber}
                onChange={set('insurerClaimNumber')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Broker Ref</label>
              <input
                type="text"
                value={form.brokerReference}
                onChange={set('brokerReference')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Assigned By</label>
              <input
                type="text"
                value={form.assignedByName}
                onChange={set('assignedByName')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Handling Adjuster</label>
              <input
                type="text"
                value={form.handlingAdjuster}
                onChange={set('handlingAdjuster')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Policy text fields */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Policy Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Policy No. (free text)</label>
              <input
                type="text"
                value={form.policyNumber}
                onChange={set('policyNumber')}
                className={inputClass}
                placeholder="Used when no policy is linked"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Type of Policy</label>
              <input
                type="text"
                value={form.policyType}
                onChange={set('policyType')}
                className={inputClass}
                placeholder="e.g. Fire, Marine, Motor"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-label-md text-outline uppercase mb-1.5">Policy Period</label>
              <input
                type="text"
                value={form.policyPeriodText}
                onChange={set('policyPeriodText')}
                className={inputClass}
                placeholder="e.g. January 1, 2024 - January 1, 2025"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-label-md text-outline uppercase mb-1.5">Policy Coverage / Sum Insured</label>
              <input
                type="text"
                value={form.policyCoverageText}
                onChange={set('policyCoverageText')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Parties */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Insured &amp; Insurance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Insured (Client)</label>
              <Select
                value={form.clientId}
                onChange={(v) => setForm({ ...form, clientId: String(v) })}
                options={[
                  { value: '', label: '— None —' },
                  ...clients.map((c) => ({ value: c['id'] as string | number, label: c['name'] as string })),
                ]}
                placeholder="— None —"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Insurer</label>
              <Select
                value={form.insuranceCompanyId}
                onChange={(v) => setForm({ ...form, insuranceCompanyId: String(v) })}
                options={[
                  { value: '', label: '— None —' },
                  ...insurers.map((i) => ({ value: i['id'] as string | number, label: i['name'] as string })),
                ]}
                placeholder="— None —"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Claim Type</label>
              <Select
                value={form.claimTypeId}
                onChange={(v) => setForm({ ...form, claimTypeId: String(v) })}
                options={[
                  { value: '', label: '— None —' },
                  ...claimTypes.map((t) => ({ value: t['id'] as string | number, label: t['name'] as string })),
                ]}
                placeholder="— None —"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Policy</label>
              <Select
                value={form.policyId}
                onChange={(v) => setForm({ ...form, policyId: String(v) })}
                options={[
                  { value: '', label: '— None —' },
                  ...policies.map((p) => ({
                    value: p['id'] as string | number,
                    label: `${p['policyNumber'] as string} · ${(p['client'] as Record<string, unknown> | undefined)?.['name'] as string} · ${(p['insuranceCompany'] as Record<string, unknown> | undefined)?.['name'] as string}`,
                  })),
                ]}
                placeholder="— None —"
              />
            </div>
          </div>

          {/* Loss info */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Loss Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Date of Loss</label>
              <input type="date" value={form.dateOfLoss} onChange={set('dateOfLoss')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Nature of Loss</label>
              <input
                type="text"
                value={form.natureOfLoss}
                onChange={set('natureOfLoss')}
                className={inputClass}
                placeholder="e.g. Fire, Burglary"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-label-md text-outline uppercase mb-1.5">Location</label>
              <input
                type="text"
                value={form.locationOfLoss}
                onChange={set('locationOfLoss')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Financial */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Financial</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Loss Reserved</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.lossReserved}
                onChange={set('lossReserved')}
                className={inputClass}
                placeholder="0.00"
              />
              <p className="text-label-sm text-outline mt-1">Saved to both Estimated Loss and Reserve.</p>
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Claimed Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.claimedAmount}
                onChange={set('claimedAmount')}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Key Dates */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Key Dates</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Date Inspected</label>
              <input
                type="date"
                value={form.dateInspected}
                onChange={set('dateInspected')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Letter Request</label>
              <input
                type="date"
                value={form.letterRequestDate}
                onChange={set('letterRequestDate')}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Denial Letter</label>
              <input
                type="date"
                value={form.denialLetterDate}
                onChange={set('denialLetterDate')}
                className={inputClass}
              />
            </div>
          </div>

          {/* Assignment */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Assign Employee</label>
              <Select
                value={form.engineerId}
                onChange={(v) => setForm({ ...form, engineerId: String(v) })}
                options={[
                  { value: '', label: '— None —' },
                  ...employees.map((u) => ({
                    value: u['id'] as string | number,
                    label: `${u['fullName'] as string} (${u['role'] as string})`,
                  })),
                ]}
                placeholder="— None —"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 border border-outline text-on-surface-variant rounded-lg font-semibold hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
