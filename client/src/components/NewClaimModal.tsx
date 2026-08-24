import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { createClaim } from '../services/claim.service.js';
import {
  getPolicies,
  getClaimTypes,
  getInsuranceCompanies,
  getClients,
} from '../services/master-data.service.js';
import { getUsers } from '../services/user.service.js';
import { Modal } from './Modal.jsx';
import { Select } from './Select.jsx';
import { AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { AxiosError } from 'axios';

interface NewClaimModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (item?: Record<string, unknown>) => void;
}

interface NewClaimForm {
  [key: string]: string;
  description: string;
  dateOfLoss: string;
  locationOfLoss: string;
  lossReserved: string;
  engineerId: string;
  accountantId: string;
  policyId: string;
  claimNumber: string;
  insuredName: string;
  insurerClaimNumber: string;
  assignedByName: string;
  handlingAdjuster: string;
  natureOfLoss: string;
  clientId: string;
  insuranceCompanyId: string;
  claimTypeId: string;
  policyNumber: string;
  policyType: string;
  policyPeriodText: string;
  policyCoverageText: string;
  claimedAmount: string;
}

const EMPTY_FORM: NewClaimForm = {
  description: '',
  dateOfLoss: '',
  locationOfLoss: '',
  lossReserved: '',
  engineerId: '',
  accountantId: '',
  policyId: '',
  claimNumber: '',
  insuredName: '',
  insurerClaimNumber: '',
  assignedByName: '',
  handlingAdjuster: '',
  natureOfLoss: '',
  clientId: '',
  insuranceCompanyId: '',
  claimTypeId: '',
  policyNumber: '',
  policyType: '',
  policyPeriodText: '',
  policyCoverageText: '',
  claimedAmount: '',
};

export function NewClaimModal({ open, onClose, onCreated }: NewClaimModalProps) {
  const [policies, setPolicies] = useState<Record<string, unknown>[]>([]);
  const [policySearch, setPolicySearch] = useState<string>('');
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [claimTypes, setClaimTypes] = useState<Record<string, unknown>[]>([]);
  const [insurers, setInsurers] = useState<Record<string, unknown>[]>([]);
  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NewClaimForm>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
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
  }, [open]);

  const employees = users.filter(
    (u) => (u['role'] as string) === 'ENGINEER' || (u['role'] as string) === 'ACCOUNTANT'
  );
  const assignedEmployee = form.engineerId
    ? `ENGINEER:${form.engineerId}`
    : form.accountantId
      ? `ACCOUNTANT:${form.accountantId}`
      : '';
  const policySearchTerm = policySearch.trim().toLowerCase();
  const filteredPolicies = policies.filter((policy) => {
    if (!policySearchTerm || String(policy['id'] as string | number) === String(form.policyId)) return true;
    const client = policy['client'] as Record<string, unknown> | undefined;
    const company = policy['insuranceCompany'] as Record<string, unknown> | undefined;
    const values = [
      policy['policyNumber'] as string | number | undefined,
      client?.['name'] as string | undefined,
      company?.['name'] as string | undefined,
    ] as (string | number | undefined)[];
    return values.some((value) => String(value || '').toLowerCase().includes(policySearchTerm));
  });

  const set = (key: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setPolicySearch('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const lossReserved = form.lossReserved ? Number(form.lossReserved) : 0;
    const payload: Record<string, unknown> = { ...form, estimatedLoss: lossReserved, reserve: lossReserved };
    delete payload['lossReserved'];
    payload['claimedAmount'] = form.claimedAmount ? Number(form.claimedAmount) : 0;
    [
      'policyId',
      'engineerId',
      'accountantId',
      'clientId',
      'insuranceCompanyId',
      'claimTypeId',
    ].forEach((k) => {
      const value = payload[k] as string | undefined;
      payload[k] = value ? Number(value) : null;
    });
    try {
      const res = await createClaim(payload);
      setForm(EMPTY_FORM);
      setPolicySearch('');
      const created = (res as Record<string, unknown>).item as Record<string, unknown> | undefined;
      onCreated?.(created);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? ((err.response?.data as Record<string, unknown> | undefined)?.['error'] as string | undefined)
          : undefined;
      setError(message ?? 'Failed to create claim');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors';

  return (
    <Modal open={open} onClose={handleClose} title="New Claim" size="xl">
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
        <>
          <p className="text-body-sm text-on-surface-variant mb-6">
            Complete the assignment details below. Select an existing policy to fill linked
            information automatically.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">
              Policy &amp; Parties
            </h3>
            <div>
              <label
                htmlFor="new-claim-policy"
                className="block text-label-md text-outline uppercase mb-1.5"
              >
                Policy
              </label>
              <div className="relative mb-2">
                <label htmlFor="new-claim-policy-search" className="sr-only">
                  Search policies
                </label>
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="new-claim-policy-search"
                  type="search"
                  value={policySearch}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPolicySearch(e.target.value)}
                  className={`${inputClass} pl-9`}
                  placeholder="Search by policy number, client, or insurer"
                />
              </div>
              <Select
                value={form.policyId}
                id="new-claim-policy"
                ariaLabel="Policy"
                onChange={(v) => {
                  const policyId = String(v);
                  const policy = policies.find((item) => String(item['id'] as string | number) === policyId);
                  setForm((current) => {
                    if (!policy) return { ...current, policyId };
                    const start = policy['startDate'] as string | number | Date | undefined;
                    const end = policy['endDate'] as string | number | Date | undefined;
                    const policyPeriod = [start, end]
                      .filter((d): d is string | number | Date => Boolean(d))
                      .map((date) =>
                        new Intl.DateTimeFormat('en-PH', { dateStyle: 'long' }).format(new Date(date))
                      )
                      .join(' – ');
                    const client = policy['client'] as Record<string, unknown> | undefined;
                    const insuranceCompany = policy['insuranceCompany'] as Record<string, unknown> | undefined;
                    const claimType = policy['claimType'] as Record<string, unknown> | undefined;
                    const coverageDetails = policy['coverageDetails'] as string | undefined;
                    const sumInsured = policy['sumInsured'] as string | number | undefined;
                    const clientId = client?.['id'] as string | number | undefined;
                    const insuranceCompanyId = insuranceCompany?.['id'] as string | number | undefined;
                    const claimTypeId = claimType?.['id'] as string | number | undefined;
                    return {
                      ...current,
                      policyId,
                      insuredName: (client?.['name'] as string | undefined) || '',
                      clientId: clientId ? String(clientId) : '',
                      insuranceCompanyId: insuranceCompanyId ? String(insuranceCompanyId) : '',
                      claimTypeId: claimTypeId ? String(claimTypeId) : '',
                      policyNumber: String((policy['policyNumber'] as string | number | undefined) || ''),
                      policyType: String((policy['policyType'] as string | number | undefined) || ''),
                      policyPeriodText: policyPeriod,
                      policyCoverageText: coverageDetails || (sumInsured ? String(sumInsured) : ''),
                    };
                  });
                }}
                options={[
                  { value: '', label: 'No linked policy / enter details manually' },
                  ...filteredPolicies.map((p) => ({
                    value: p['id'] as string | number,
                    label: `${p['policyNumber'] as string} · ${(p['client'] as Record<string, unknown> | undefined)?.['name'] as string} · ${(p['insuranceCompany'] as Record<string, unknown> | undefined)?.['name'] as string}`,
                  })),
                ]}
                placeholder="No linked policy / enter details manually"
              />
              {policySearchTerm && filteredPolicies.length === 0 && (
                <p className="mt-1.5 text-body-sm text-on-surface-variant" role="status">
                  No policies match your search.
                </p>
              )}
            </div>

            <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">
              Assignment Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  OCS Ref. No. *
                </label>
                <input
                  type="text"
                  value={form.claimNumber}
                  onChange={set('claimNumber')}
                  className={inputClass}
                  required={!form.policyId}
                  placeholder="OCS-XXXXXX/XXX"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  Insurer&apos;s Claim No.
                </label>
                <input
                  type="text"
                  value={form.insurerClaimNumber}
                  onChange={set('insurerClaimNumber')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  Assigned By
                </label>
                <input
                  type="text"
                  value={form.assignedByName}
                  onChange={set('assignedByName')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  Handling Adjuster
                </label>
                <input
                  type="text"
                  value={form.handlingAdjuster}
                  onChange={set('handlingAdjuster')}
                  className={inputClass}
                  placeholder="Adjuster code"
                />
              </div>
            </div>

            <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">
              Insured &amp; Insurance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-claim-insured-name"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Insured Name *
                </label>
                <input
                  id="new-claim-insured-name"
                  type="text"
                  value={form.insuredName}
                  onChange={set('insuredName')}
                  className={inputClass}
                  required={!form.policyId}
                />
              </div>
              <div>
                <label
                  htmlFor="new-claim-client"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Client (linked)
                </label>
                <Select
                  value={form.clientId}
                  id="new-claim-client"
                  ariaLabel="Client (linked)"
                  onChange={(v) => setForm({ ...form, clientId: String(v) })}
                  options={[
                    { value: '', label: '— Unresolved —' },
                    ...clients.map((c) => ({ value: c['id'] as string | number, label: c['name'] as string })),
                  ]}
                  placeholder="— Unresolved —"
                />
              </div>
              <div>
                <label
                  htmlFor="new-claim-insurer"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Insurer
                </label>
                <Select
                  value={form.insuranceCompanyId}
                  id="new-claim-insurer"
                  ariaLabel="Insurer"
                  onChange={(v) => setForm({ ...form, insuranceCompanyId: String(v) })}
                  options={[
                    { value: '', label: '— Unresolved —' },
                    ...insurers.map((i) => ({ value: i['id'] as string | number, label: i['name'] as string })),
                  ]}
                  placeholder="— Unresolved —"
                />
              </div>
              <div>
                <label
                  htmlFor="new-claim-type"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Claim Type
                </label>
                <Select
                  value={form.claimTypeId}
                  id="new-claim-type"
                  ariaLabel="Claim Type"
                  onChange={(v) => setForm({ ...form, claimTypeId: String(v) })}
                  options={[
                    { value: '', label: '— Unresolved —' },
                    ...claimTypes.map((t) => ({ value: t['id'] as string | number, label: t['name'] as string })),
                  ]}
                  placeholder="— Unresolved —"
                />
              </div>
            </div>

            <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">
              Policy Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-claim-policy-number"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Policy No.
                </label>
                <input
                  id="new-claim-policy-number"
                  type="text"
                  value={form.policyNumber}
                  onChange={set('policyNumber')}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="new-claim-policy-type"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Type of Policy
                </label>
                <input
                  id="new-claim-policy-type"
                  type="text"
                  value={form.policyType}
                  onChange={set('policyType')}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  Policy Period
                </label>
                <input
                  type="text"
                  value={form.policyPeriodText}
                  onChange={set('policyPeriodText')}
                  className={inputClass}
                  placeholder="e.g. January 1, 2024 - January 1, 2025"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  Policy Coverage / Total Sum Insured
                </label>
                <input
                  type="text"
                  value={form.policyCoverageText}
                  onChange={set('policyCoverageText')}
                  className={inputClass}
                />
              </div>
            </div>

            <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">
              Loss Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="new-claim-date-of-loss"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Date of Loss *
                </label>
                <input
                  id="new-claim-date-of-loss"
                  type="date"
                  value={form.dateOfLoss}
                  onChange={set('dateOfLoss')}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  value={form.locationOfLoss}
                  onChange={set('locationOfLoss')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  Nature of Loss
                </label>
                <input
                  type="text"
                  value={form.natureOfLoss}
                  onChange={set('natureOfLoss')}
                  className={inputClass}
                  placeholder="e.g. Fire, Burglary"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">
                  Amount of Claim
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.claimedAmount}
                  onChange={set('claimedAmount')}
                  className={inputClass}
                />
              </div>
              <div>
                <label
                  htmlFor="new-claim-loss-reserved"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Loss Reserved
                </label>
                <input
                  id="new-claim-loss-reserved"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.lossReserved}
                  onChange={set('lossReserved')}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
              />
            </div>

            <h3 className="text-body-md font-semibold text-primary border-b border-surface-border pb-2">
              Assignments
            </h3>
            <div>
              <label
                htmlFor="new-claim-employee"
                className="block text-label-md text-outline uppercase mb-1.5"
              >
                Assign Employee
              </label>
              <Select
                value={assignedEmployee}
                id="new-claim-employee"
                ariaLabel="Assign Employee"
                onChange={(v) => {
                  const [role, id = ''] = String(v).split(':');
                  setForm((current) => ({
                    ...current,
                    engineerId: role === 'ENGINEER' ? id : current.engineerId,
                    accountantId: role === 'ACCOUNTANT' ? id : current.accountantId,
                  }));
                }}
                options={[
                  { value: '', label: 'Select employee' },
                  ...employees.map((employee) => ({
                    value: `${employee['role'] as string}:${employee['id'] as string | number}`,
                    label: `${employee['fullName'] as string} — ${(employee['role'] as string) === 'ENGINEER' ? 'Engineer' : 'Accountant'}`,
                  })),
                ]}
                placeholder="Select employee"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                {saving ? 'Creating...' : 'Create Claim'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="h-10 px-4 border border-outline text-on-surface-variant rounded-lg font-semibold hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
