import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { updateClaim } from '../services/claim.service.js';
import { getUsers } from '../services/user.service.js';
import { Modal } from './Modal.jsx';
import { Select } from './Select.jsx';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { AxiosError } from 'axios';

interface User {
  id: number;
  fullName: string;
  role: string;
}

interface Claim {
  id: number;
  engineerId?: number | null;
  accountantId?: number | null;
  assignedByName?: string | null;
}

interface AssignForm {
  engineerId: string;
  accountantId: string;
  assignedByName: string;
}

interface AssignClaimModalProps {
  open: boolean;
  onClose: () => void;
  claim: Claim | null;
  onSaved?: () => void;
}

export function AssignClaimModal({ open, onClose, claim, onSaved }: AssignClaimModalProps) {
  const [form, setForm] = useState<AssignForm>({ engineerId: '', accountantId: '', assignedByName: '' });
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onSaved?.();
        onClose();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [success, onSaved, onClose]);

  useEffect(() => {
    if (!open || !claim) return;
    setForm({
      engineerId: claim.engineerId ? String(claim.engineerId) : '',
      accountantId: claim.accountantId ? String(claim.accountantId) : '',
      assignedByName: claim.assignedByName || '',
    });
    setError(null);
    setSuccess(false);
    getUsers()
      .then((data) => setUsers((data as { users: User[] }).users || []))
      .catch(() => setError('Failed to load users'));
  }, [open, claim]);

  const engineers = users.filter((u) => u.role === 'ENGINEER');
  const accountants = users.filter((u) => u.role === 'ACCOUNTANT');

  const set = (key: keyof AssignForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!claim) return;
    setSaving(true);
    setError(null);
    try {
      await updateClaim(claim.id, {
        engineerId: form.engineerId ? Number(form.engineerId) : null,
        accountantId: form.accountantId ? Number(form.accountantId) : null,
        assignedByName: form.assignedByName,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        (err instanceof AxiosError && err.response?.data?.error) ||
        (err instanceof Error ? err.message : 'Failed to update assignment')
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors';

  return (
    <Modal open={open} onClose={onClose} title="Assign Engineer & Accountant" size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 bg-error-container/10 border border-error/30 rounded-lg p-3 text-error text-body-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 bg-success/10 border border-success/30 rounded-lg p-3 text-success text-body-sm">
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
            <p>Assignment updated successfully.</p>
          </div>
        )}

        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Engineer</label>
          <Select
            value={form.engineerId}
            onChange={(v) => setForm({ ...form, engineerId: String(v) })}
            options={[
              { value: '', label: '— None —' },
              ...engineers.map((u) => ({ value: u.id, label: u.fullName })),
            ]}
            placeholder="— None —"
          />
        </div>

        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Accountant</label>
          <Select
            value={form.accountantId}
            onChange={(v) => setForm({ ...form, accountantId: String(v) })}
            options={[
              { value: '', label: '— None —' },
              ...accountants.map((u) => ({ value: u.id, label: u.fullName })),
            ]}
            placeholder="— None —"
          />
        </div>

        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Assigned By</label>
          <input
            type="text"
            value={form.assignedByName}
            onChange={set('assignedByName')}
            className={inputClass}
            placeholder="Name of person assigning this claim"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded border border-outline text-on-surface-variant hover:bg-surface-container-high transition-colors text-body-md font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-4 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors text-body-md disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Assignment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
