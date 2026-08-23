import { useEffect, useState } from 'react';
import { updateClaim } from '../services/claim.service.js';
import { getPolicies, getClaimTypes, getInsuranceCompanies, getClients } from '../services/master-data.service.js';
import { getUsers } from '../services/user.service.js';
import { Modal } from './Modal.jsx';
import { Select } from './Select.jsx';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function EditClaimModal({ open, onClose, claim, onSaved }) {
  const [policies, setPolicies] = useState([]);
  const [users, setUsers] = useState([]);
  const [claimTypes, setClaimTypes] = useState([]);
  const [insurers, setInsurers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    if (!open || !claim) return;
    setLoading(true);
    setError(null);
    setForm({
      claimNumber: claim.claimNumber || '',
      assignmentNumber: claim.assignmentNumber || '',
      insurerClaimNumber: claim.insurerClaimNumber || '',
      clientId: claim.clientId || '',
      insuranceCompanyId: claim.insuranceCompanyId || '',
      claimTypeId: claim.claimTypeId || '',
      policyId: claim.policyId || '',
      brokerReference: claim.brokerReference || '',
      assignedByName: claim.assignedByName || '',
      handlingAdjuster: claim.handlingAdjuster || '',
      policyNumber: claim.policyNumber || '',
      policyType: claim.policyType || '',
      natureOfLoss: claim.natureOfLoss || '',
      locationOfLoss: claim.locationOfLoss || '',
      description: claim.description || '',
      dateOfLoss: claim.dateOfLoss ? new Date(claim.dateOfLoss).toISOString().slice(0, 10) : '',
      dateInspected: claim.dateInspected ? new Date(claim.dateInspected).toISOString().slice(0, 10) : '',
      letterRequestDate: claim.letterRequestDate ? new Date(claim.letterRequestDate).toISOString().slice(0, 10) : '',
      denialLetterDate: claim.denialLetterDate ? new Date(claim.denialLetterDate).toISOString().slice(0, 10) : '',
      policyPeriodText: claim.policyPeriodText || '',
      policyCoverageText: claim.policyCoverageText || '',
      lossReserved: claim.estimatedLoss || claim.reserve || '',
      claimedAmount: claim.claimedAmount || '',
      engineerId: claim.engineerId || '',
      accountantId: claim.accountantId || '',
    });
    Promise.all([getPolicies(), getUsers(), getClaimTypes(), getInsuranceCompanies(), getClients()])
      .then(([policiesData, usersData, claimTypesData, insurersData, clientsData]) => {
        setPolicies(policiesData.items || []);
        setUsers(usersData.users || []);
        setClaimTypes(claimTypesData.items || []);
        setInsurers(insurersData.items || []);
        setClients(clientsData.items || []);
      })
      .catch(() => setError('Failed to load reference data'))
      .finally(() => setLoading(false));
  }, [open, claim]);

  const employees = users.filter((u) => u.role === 'ENGINEER' || u.role === 'ACCOUNTANT');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { ...form };
    const lossReserved = payload.lossReserved ? Number(payload.lossReserved) : 0;
    payload.estimatedLoss = lossReserved;
    payload.reserve = lossReserved;
    delete payload.lossReserved;
    payload.claimedAmount = payload.claimedAmount ? Number(payload.claimedAmount) : 0;
    ['policyId', 'engineerId', 'accountantId', 'clientId', 'insuranceCompanyId', 'claimTypeId'].forEach((k) => {
      payload[k] = payload[k] ? Number(payload[k]) : null;
    });
    try {
      const res = await updateClaim(claim.id, payload);
      onSaved?.(res.item);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update claim');
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">OCS Ref. No.</label>
              <input type="text" value={form.claimNumber} onChange={set('claimNumber')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Assignment #</label>
              <input type="text" value={form.assignmentNumber} onChange={set('assignmentNumber')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Insurer&apos;s Claim No.</label>
              <input type="text" value={form.insurerClaimNumber} onChange={set('insurerClaimNumber')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Broker Ref</label>
              <input type="text" value={form.brokerReference} onChange={set('brokerReference')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Assigned By</label>
              <input type="text" value={form.assignedByName} onChange={set('assignedByName')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Handling Adjuster</label>
              <input type="text" value={form.handlingAdjuster} onChange={set('handlingAdjuster')} className={inputClass} />
            </div>
          </div>

          {/* Policy text fields */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Policy Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Policy No. (free text)</label>
              <input type="text" value={form.policyNumber} onChange={set('policyNumber')} className={inputClass} placeholder="Used when no policy is linked" />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Type of Policy</label>
              <input type="text" value={form.policyType} onChange={set('policyType')} className={inputClass} placeholder="e.g. Fire, Marine, Motor" />
            </div>
            <div className="col-span-2">
              <label className="block text-label-md text-outline uppercase mb-1.5">Policy Period</label>
              <input type="text" value={form.policyPeriodText} onChange={set('policyPeriodText')} className={inputClass} placeholder="e.g. January 1, 2024 - January 1, 2025" />
            </div>
            <div className="col-span-2">
              <label className="block text-label-md text-outline uppercase mb-1.5">Policy Coverage / Sum Insured</label>
              <input type="text" value={form.policyCoverageText} onChange={set('policyCoverageText')} className={inputClass} />
            </div>
          </div>

          {/* Parties */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Insured &amp; Insurance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Insured (Client)</label>
              <Select
                value={form.clientId}
                onChange={(v) => setForm({ ...form, clientId: v })}
                options={[
                  { value: '', label: '— None —' },
                  ...clients.map((c) => ({ value: c.id, label: c.name })),
                ]}
                placeholder="— None —"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Insurer</label>
              <Select
                value={form.insuranceCompanyId}
                onChange={(v) => setForm({ ...form, insuranceCompanyId: v })}
                options={[
                  { value: '', label: '— None —' },
                  ...insurers.map((i) => ({ value: i.id, label: i.name })),
                ]}
                placeholder="— None —"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Claim Type</label>
              <Select
                value={form.claimTypeId}
                onChange={(v) => setForm({ ...form, claimTypeId: v })}
                options={[
                  { value: '', label: '— None —' },
                  ...claimTypes.map((t) => ({ value: t.id, label: t.name })),
                ]}
                placeholder="— None —"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Policy</label>
              <Select
                value={form.policyId}
                onChange={(v) => setForm({ ...form, policyId: v })}
                options={[
                  { value: '', label: '— None —' },
                  ...policies.map((p) => ({
                    value: p.id,
                    label: `${p.policyNumber} · ${p.client?.name} · ${p.insuranceCompany?.name}`,
                  })),
                ]}
                placeholder="— None —"
              />
            </div>
          </div>

          {/* Loss info */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Loss Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Date of Loss</label>
              <input type="date" value={form.dateOfLoss} onChange={set('dateOfLoss')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Nature of Loss</label>
              <input type="text" value={form.natureOfLoss} onChange={set('natureOfLoss')} className={inputClass} placeholder="e.g. Fire, Burglary" />
            </div>
            <div className="col-span-2">
              <label className="block text-label-md text-outline uppercase mb-1.5">Location</label>
              <input type="text" value={form.locationOfLoss} onChange={set('locationOfLoss')} className={inputClass} />
            </div>
          </div>

          {/* Financial */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Financial</h3>
          <div className="grid grid-cols-2 gap-4">
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
              <input type="date" value={form.dateInspected} onChange={set('dateInspected')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Letter Request</label>
              <input type="date" value={form.letterRequestDate} onChange={set('letterRequestDate')} className={inputClass} />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Denial Letter</label>
              <input type="date" value={form.denialLetterDate} onChange={set('denialLetterDate')} className={inputClass} />
            </div>
          </div>

          {/* Assignment */}
          <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">Assignment</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Assign Employee</label>
              <Select
                value={form.engineerId}
                onChange={(v) => setForm({ ...form, engineerId: v })}
                options={[
                  { value: '', label: '— None —' },
                  ...employees.map((u) => ({ value: u.id, label: `${u.fullName} (${u.role})` })),
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
