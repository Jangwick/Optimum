import { useEffect, useState, useCallback, useRef, type ChangeEvent, type FormEvent, type DragEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { getClaim, updateClaimStatus, addClaimInsurer, updateClaimInsurer, removeClaimInsurer } from '../services/claim.service.js';
import { getClaimStatuses } from '../services/master-data.service.js';
import {
  getDocuments,
  uploadDocument,
  markDocumentReceived,
  deleteDocument,
  downloadDocument,
  getDocumentPreviewUrl,
} from '../services/document.service.js';
import { authUrl } from '../services/api.js';
import { getAssessments, createAssessment, deleteAssessment } from '../services/assessment.service.js';
import { getSettlement, saveSettlement, getOffers, createOffer, respondToOffer } from '../services/settlement.service.js';
import { getReports, createReport, generateReport, askClarification, getDownloadUrl } from '../services/report.service.js';
import { getInspections } from '../services/investigation.service.js';
import { getDocumentCategories, getInsuranceCompanies } from '../services/master-data.service.js';
import { formatCurrency } from '../utils/currency.js';
import { stripHtml } from '../utils/sanitize.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClaimInvestigation from '../components/ClaimInvestigation.jsx';
import ClaimFinance from '../components/ClaimFinance.jsx';
import { EditClaimModal } from '../components/EditClaimModal.jsx';
import { Modal } from '../components/Modal.jsx';
import { Select } from '../components/Select.jsx';
import { AppLayout } from '../components/AppLayout.jsx';
import { setBreadcrumbLabel } from '../components/Breadcrumbs.jsx';
import { type LucideIcon } from 'lucide-react';
import {
  Lock,
  Ban,
  AlertTriangle,
  FileText,
  GitBranch,
  Search,
  FolderOpen,
  ClipboardCheck,
  Handshake,
  Wallet,
  FileBarChart,
  Building2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle,
  Download,
  FileCheck,
  File,
  UploadCloud,
  X,
  Pencil,
  Calendar,
  Camera,
  Eye,
} from 'lucide-react';

type Data = Record<string, unknown>;

function getString(data: Data | null | undefined, key: string): string | undefined {
  return data?.[key] as string | undefined;
}

function getNumber(data: Data | null | undefined, key: string): number | undefined {
  return data?.[key] as number | undefined;
}

function getBoolean(data: Data | null | undefined, key: string): boolean | undefined {
  return data?.[key] as boolean | undefined;
}

function getRecord(data: Data | null | undefined, key: string): Data | undefined {
  return data?.[key] as Data | undefined;
}

function getArray(data: Data | null | undefined, key: string): Data[] | undefined {
  return data?.[key] as Data[] | undefined;
}

function getId(data: Data | null | undefined, key: string): string | number | undefined {
  return data?.[key] as string | number | undefined;
}

const STATUS_ORDER: string[] = [
  'NEW',
  'ASSIGNED',
  'INVESTIGATION',
  'INSPECTION_SCHEDULED',
  'INSPECTION_COMPLETED',
  'DOCUMENTS_PENDING',
  'DOCUMENTS_RECEIVED',
  'ASSESSMENT',
  'REPORT_DRAFT',
  'REPORT_SUBMITTED',
  'CLIENT_REVIEW',
  'CLARIFICATION_NEEDED',
  'CLARIFICATION_PROVIDED',
  'SETTLEMENT',
  'OFFER_SENT',
  'FEE_INVOICED',
  'PAYMENT_RECEIVED',
  'CLOSED',
  'CANCELLED',
];

// Compact milestone stages for the progress indicator (groups the 18 statuses into 6 phases)
const WORKFLOW_PHASES: { key: string; label: string; statuses: string[]; icon: LucideIcon }[] = [
  { key: 'intake', label: 'New Claim', statuses: ['NEW', 'ASSIGNED'], icon: FileText },
  { key: 'investigation', label: 'Investigation', statuses: ['INVESTIGATION', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED'], icon: Search },
  { key: 'documents', label: 'Documents', statuses: ['DOCUMENTS_PENDING', 'DOCUMENTS_RECEIVED'], icon: FolderOpen },
  { key: 'assessment', label: 'Assessment', statuses: ['ASSESSMENT', 'REPORT_DRAFT', 'REPORT_SUBMITTED', 'CLIENT_REVIEW', 'CLARIFICATION_NEEDED', 'CLARIFICATION_PROVIDED'], icon: ClipboardCheck },
  { key: 'settlement', label: 'Settlement', statuses: ['SETTLEMENT', 'OFFER_SENT', 'FEE_INVOICED', 'PAYMENT_RECEIVED'], icon: Handshake },
  { key: 'closed', label: 'Closed', statuses: ['CLOSED'], icon: CheckCircle },
];

interface WorkflowProgressProps {
  currentStatus: string;
  isCancelled?: boolean | undefined;
}

export function WorkflowProgress({ currentStatus, isCancelled }: WorkflowProgressProps) {
  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error/10 text-error text-body-sm font-medium">
        <Ban size={16} />
        Cancelled
      </div>
    );
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isClosed = currentStatus === 'CLOSED';

  const phaseStates = WORKFLOW_PHASES.map((phase) => {
    const phaseStatusIndices = phase.statuses.map((s) => STATUS_ORDER.indexOf(s));
    const minIdx = Math.min(...phaseStatusIndices);
    const maxIdx = Math.max(...phaseStatusIndices);
    if (currentIdx >= maxIdx) return { ...phase, state: 'done' as const };
    if (currentIdx >= minIdx) return { ...phase, state: 'active' as const };
    return { ...phase, state: 'pending' as const };
  });

  const styles: Record<'done' | 'active' | 'pending', string> = {
    done: 'bg-success-green/10 text-success-green border-success-green/30',
    active: 'bg-primary/10 text-primary border-primary/30 ring-2 ring-primary/20',
    pending: 'bg-surface-container-low text-outline border-surface-border',
  };

  return (
    <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap overflow-x-auto sm:overflow-visible -mx-1 px-1">
      {phaseStates.map((phase, idx) => {
        const Icon = phase.icon;
        const styleClass = styles[phase.state as 'done' | 'active' | 'pending'];
        return (
          <div key={phase.key} className="flex items-center gap-1">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-label-md font-medium ${styleClass}`}
              title={phase.statuses.join(', ')}
            >
              <Icon size={14} />
              {phase.label}
            </div>
            {idx < phaseStates.length - 1 && (
              <div className={`w-4 h-px ${phase.state === 'done' ? 'bg-success-green/40' : 'bg-surface-border'}`} />
            )}
          </div>
        );
      })}
      {isClosed && <CheckCircle size={16} className="text-success-green ml-1" />}
    </div>
  );
}

// Maps each workflow status to a recommended next action
const NEXT_STEP_HINTS: Record<string, { action: string; tab: string } | null> = {
  NEW: { action: 'Assign the claim to an adjuster', tab: 'summary' },
  ASSIGNED: { action: 'Begin investigation — schedule a site inspection', tab: 'investigation' },
  INVESTIGATION: { action: 'Schedule and conduct a site inspection', tab: 'investigation' },
  INSPECTION_SCHEDULED: { action: 'Conduct the inspection and record findings', tab: 'investigation' },
  INSPECTION_COMPLETED: { action: 'Collect and upload required documents', tab: 'documents' },
  DOCUMENTS_PENDING: { action: 'Follow up on pending documents from the client', tab: 'documents' },
  DOCUMENTS_RECEIVED: { action: 'Prepare the loss assessment', tab: 'assessment' },
  ASSESSMENT: { action: 'Complete the assessment and draft the report', tab: 'reports' },
  REPORT_DRAFT: { action: 'Review and submit the draft report', tab: 'reports' },
  REPORT_SUBMITTED: { action: 'Await client review of the submitted report', tab: 'reports' },
  CLIENT_REVIEW: { action: 'Address any client clarifications', tab: 'reports' },
  CLARIFICATION_NEEDED: { action: 'Provide clarification to the client', tab: 'reports' },
  CLARIFICATION_PROVIDED: { action: 'Proceed to settlement negotiation', tab: 'settlement' },
  SETTLEMENT: { action: 'Prepare and send the settlement offer', tab: 'settlement' },
  OFFER_SENT: { action: 'Await client response to the settlement offer', tab: 'settlement' },
  FEE_INVOICED: { action: 'Track payment from the client', tab: 'finance' },
  PAYMENT_RECEIVED: { action: 'Close the claim', tab: 'summary' },
  CLOSED: null,
  CANCELLED: null,
};

interface ClaimDetailTab {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const CLAIM_DETAIL_TABS: ClaimDetailTab[] = [
  { key: 'summary', label: 'Summary', icon: FileText },
  { key: 'investigation', label: 'Investigation', icon: Search },
  { key: 'documents', label: 'Documents', icon: FolderOpen },
  { key: 'assessment', label: 'Assessment', icon: ClipboardCheck },
  { key: 'settlement', label: 'Settlement', icon: Handshake },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'reports', label: 'Reports', icon: FileBarChart },
  { key: 'insurers', label: 'Insurer Panel', icon: Building2 },
];

interface ClaimDetailContentProps {
  claimId: string | number;
}

export default function ClaimDetail() {
  const { id } = useParams();
  const claimId = id ?? '';
  return (
    <AppLayout>
      <ClaimDetailContent claimId={claimId} />
    </AppLayout>
  );
}

export function ClaimDetailContent({ claimId }: ClaimDetailContentProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claim, setClaim] = useState<Data | null>(null);
  const [statuses, setStatuses] = useState<Data[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [showEdit, setShowEdit] = useState(false);

  const onClaimChange = useCallback(() => setRefresh((r) => r + 1), []);

  // Keyboard shortcuts: Alt+1..8 to jump between Claim Detail tabs
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        if (idx < CLAIM_DETAIL_TABS.length) {
          const tab = CLAIM_DETAIL_TABS[idx];
          if (tab) {
            e.preventDefault();
            setActiveTab(tab.key);
          }
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Reload claim data only when returning to the Summary tab,
  // so Summary always shows fresh data without unnecessary reloads on other tabs.
  const prevTabRef = useRef<string>(activeTab);
  useEffect(() => {
    if (prevTabRef.current !== activeTab && activeTab === 'summary') {
      prevTabRef.current = activeTab;
      setRefresh((r) => r + 1);
    } else {
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const claimData = (await getClaim(claimId)) as Data;
        const statusesData = (await getClaimStatuses()) as Data;
        const inspectionsData = (await getInspections(claimId)) as Data;
        const documentsData = (await getDocuments(claimId)) as Data;
        const documents = ((documentsData['items'] as Data[] | undefined) ?? []).flatMap((group) => {
          const uploaded = (group['uploaded'] as Data[] | undefined) ?? [];
          const category = getRecord(group, 'category');
          return uploaded.map((document) => ({
            ...document,
            category: getString(category, 'name') ?? 'Uncategorized',
          }));
        });
        const item = (claimData['item'] as Data | undefined) ?? {};
        setClaim({
          ...item,
          inspections: (inspectionsData['items'] as Data[] | undefined) ?? [],
          documents,
        });
        setStatuses((statusesData['items'] as Data[] | undefined) ?? []);
        setSelectedStatus(getString(getRecord(item, 'status'), 'code') ?? '');
        setBreadcrumbLabel(getString(item, 'claimNumber') ?? 'Claim Details');
      } finally {
        setLoading(false);
      }
    },
    [claimId]
  );

  useEffect(() => {
    load(refresh > 0);
  }, [load, refresh]);

  const handleTransition = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === getString(getRecord(claim, 'status'), 'code')) return;
    await updateClaimStatus(claimId, { statusCode: selectedStatus, notes: statusNote });
    setStatusNote('');
    setRefresh((r) => r + 1);
  };

  if (loading || !claim) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-body-md text-on-surface-variant">Loading claim details...</p>
      </div>
    );
  }

  const isReadOnly = !!getBoolean(claim, 'isReadOnly');
  const isCancelled = !!getBoolean(claim, 'isCancelled');
  const currentStatus = getString(getRecord(claim, 'status'), 'code') ?? '';

  return (
    <div className="p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/claims')}
        className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Claims
      </button>

      {/* Header card */}
      <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={20} className="text-primary shrink-0" />
              <h2 className="text-headline-lg font-semibold text-primary font-mono">{getString(claim, 'claimNumber')}</h2>
            </div>
            <p className="text-body-md text-on-surface-variant">
              {getString(getRecord(claim, 'claimType'), 'name') ?? '—'} · {getString(getRecord(claim, 'client'), 'name') ?? '—'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {getRecord(claim, 'processStatus') && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md font-medium"
                style={{
                  backgroundColor: `${getString(getRecord(claim, 'processStatus'), 'color')}1a`,
                  color: getString(getRecord(claim, 'processStatus'), 'color'),
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getString(getRecord(claim, 'processStatus'), 'color') }}
                />
                {getString(getRecord(claim, 'processStatus'), 'name')}
              </span>
            )}
            {getRecord(claim, 'importStatus') && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium bg-surface-container-high text-on-surface-variant"
                title="Historical OCS import status"
              >
                OCS: {getString(getRecord(claim, 'importStatus'), 'name')}
              </span>
            )}
            {getRecord(claim, 'status') && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium opacity-60"
                style={{
                  backgroundColor: `${getString(getRecord(claim, 'status'), 'color')}1a`,
                  color: getString(getRecord(claim, 'status'), 'color'),
                }}
                title="Secondary internal status (read-only / action-driven)"
              >
                Internal: {getString(getRecord(claim, 'status'), 'code')}
              </span>
            )}
          </div>
        </div>
        {/* Workflow Progress Indicator */}
        <div className="mt-4 pt-4 border-t border-surface-border">
          <WorkflowProgress currentStatus={currentStatus} isCancelled={isCancelled} />
        </div>
      </div>

      {/* Read-only alert */}
      {isReadOnly && (
        <div
          className={`mb-6 rounded-lg border p-4 flex items-start gap-3 ${
            isCancelled
              ? 'bg-error/5 border-error/30 text-error'
              : 'bg-accent-orange/5 border-accent-orange/30 text-accent-orange'
          }`}
        >
          {isCancelled ? <Ban size={20} className="mt-0.5 shrink-0" /> : <Lock size={20} className="mt-0.5 shrink-0" />}
          <div>
            <p className="font-semibold text-body-md">
              {isCancelled ? 'Cancelled Historical Record' : 'Closed Historical Record'}
            </p>
            <p className="text-body-sm mt-0.5 text-on-surface-variant">
              {isCancelled
                ? `This claim was cancelled during migration and is read-only. Reason: ${getString(claim, 'cancellationReason') ?? 'Not specified'}`
                : 'This claim was imported from a closed workbook sheet and is read-only. Use Admin override with a reason to make changes.'}
            </p>
          </div>
        </div>
      )}

      {/* Incomplete record alert */}
      {!!getBoolean(claim, 'isIncomplete') && !isReadOnly && (
        <div className="mb-6 bg-accent-orange/5 border border-accent-orange/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-accent-orange" />
          <div>
            <p className="font-semibold text-body-md text-accent-orange">Incomplete Record</p>
            {((claim['incompleteReasons'] as string[] | undefined)?.length ?? 0) > 0 && (
              <ul className="text-body-sm list-disc list-inside mt-1 text-on-surface-variant">
                {(claim['incompleteReasons'] as string[] | undefined)?.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Tabs with icons */}
      <div className="flex gap-1 border-b border-surface-border mb-6 overflow-x-auto">
        {CLAIM_DETAIL_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-body-md font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              <Icon size={16} className={activeTab === t.key ? 'text-primary' : 'text-outline'} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'summary' && (
        <SummaryTab
          claim={claim}
          statuses={statuses}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          statusNote={statusNote}
          setStatusNote={setStatusNote}
          onTransition={handleTransition}
          onEditClaim={() => setShowEdit(true)}
          canEdit={user?.role === 'ADMIN' && !isReadOnly}
          isReadOnly={isReadOnly}
          onNavigateTab={setActiveTab}
        />
      )}
      {activeTab === 'investigation' && <ClaimInvestigation claimId={claimId} claim={claim} onClaimChange={onClaimChange} />}
      {activeTab === 'documents' && <DocumentsTab claimId={claimId} onClaimChange={onClaimChange} />}
      {activeTab === 'assessment' && <AssessmentTab claimId={claimId} onClaimChange={onClaimChange} />}
      {activeTab === 'settlement' && <SettlementTab claimId={claimId} onClaimChange={onClaimChange} />}
      {activeTab === 'finance' && <ClaimFinance claimId={claimId} onClaimChange={onClaimChange} />}
      {activeTab === 'reports' && <ReportsTab claimId={claimId} onClaimChange={onClaimChange} />}
      {activeTab === 'insurers' && (
        <InsurerPanelTab
          claim={claim}
          claimId={claimId}
          isAdmin={user?.role === 'ADMIN'}
          onClaimChange={onClaimChange}
        />
      )}

      <EditClaimModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        claim={claim}
        onSaved={() => setRefresh((r) => r + 1)}
      />
    </div>
  );
}

interface InfoProps {
  label: string;
  value?: ReactNode;
  money?: boolean;
  mono?: boolean;
}

function Info({ label, value, money, mono }: InfoProps) {
  return (
    <div className="min-w-0">
      <span className="text-label-md text-outline uppercase tracking-wide">{label}</span>
      <p className={`mt-1 text-on-surface break-words ${money || mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

interface SummaryTabProps {
  claim: Data;
  statuses: Data[];
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  statusNote: string;
  setStatusNote: (value: string) => void;
  onTransition: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  onEditClaim: () => void;
  canEdit: boolean;
  isReadOnly: boolean;
  onNavigateTab: (tab: string) => void;
}

function SummaryTab({
  claim,
  statuses,
  selectedStatus,
  setSelectedStatus,
  statusNote,
  setStatusNote,
  onTransition,
  onEditClaim,
  canEdit,
  isReadOnly,
  onNavigateTab,
}: SummaryTabProps) {
  const fin = getRecord(claim, 'financials') ?? {};
  const statusCode = getString(getRecord(claim, 'status'), 'code');
  const nextStep = statusCode ? NEXT_STEP_HINTS[statusCode] : undefined;

  // Build compact timeline from processHistory + activities + correspondence
  const timelineEvents = [
    ...(getArray(claim, 'processHistory') ?? []).map((h) => ({
      id: `p-${getId(h, 'id') ?? ''}`,
      type: 'status' as const,
      date: getString(h, 'createdAt'),
      title: getString(getRecord(h, 'status'), 'name') ?? getString(getRecord(h, 'status'), 'code') ?? 'Status Change',
      desc: getString(h, 'notes'),
      actor: getString(h, 'changedBy'),
    })),
    ...(getArray(claim, 'activities') ?? []).map((a) => ({
      id: `a-${getId(a, 'id') ?? ''}`,
      type: 'activity' as const,
      date: getString(a, 'occurredAt'),
      title: (() => {
        const activityType = getString(a, 'activityType');
        return activityType
          ? activityType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())
          : 'Activity';
      })(),
      desc: getString(a, 'description'),
      actor: getString(a, 'actor'),
    })),
    ...(getArray(claim, 'correspondence') ?? []).map((c) => ({
      id: `c-${getId(c, 'id') ?? ''}`,
      type: 'correspondence' as const,
      date: getString(c, 'sentAt'),
      title: getString(c, 'type') ?? 'Correspondence',
      desc: getString(c, 'notes'),
      actor: getString(c, 'recipient'),
    })),
  ]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 12);

  const EVENT_ICONS: Record<'status' | 'activity' | 'correspondence', LucideIcon> = {
    status: CheckCircle,
    activity: GitBranch,
    correspondence: FileText,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Claim Summary</h3>
            </div>
            {canEdit && (
              <button
                onClick={onEditClaim}
                className="inline-flex items-center gap-1.5 h-9 px-3 border border-outline text-on-surface-variant rounded-lg text-body-sm font-medium hover:bg-surface-container-high hover:text-primary transition-colors"
              >
                <Pencil size={16} />
                Edit Claim
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-body-md">
            <Info label="OCS Ref #" value={getString(claim, 'claimNumber')} mono />
            <Info label="Assignment #" value={getString(claim, 'assignmentNumber')} mono />
            <Info label="Insurer Claim #" value={getString(claim, 'insurerClaimNumber')} mono />
            <Info label="Handling Adjuster" value={getString(claim, 'handlingAdjuster') ?? getString(getRecord(claim, 'engineer'), 'fullName')} />
            <Info label="Insured" value={getString(getRecord(claim, 'client'), 'name')} />
            <Info label="Insurer" value={getString(getRecord(claim, 'insuranceCompany'), 'name')} />
            <Info label="Broker" value={getString(getRecord(claim, 'broker'), 'name')} />
            <Info label="Broker Ref" value={getString(claim, 'brokerReference')} mono />
            <Info label="Policy No." value={getString(getRecord(claim, 'policy'), 'policyNumber') ?? getString(claim, 'policyNumber')} mono />
            <Info label="Policy Type" value={getString(claim, 'policyType')} />
            <Info label="Policy Period" value={getString(claim, 'policyPeriodText')} />
            <Info
              label="Date of Loss"
              value={getString(claim, 'dateOfLoss') ? new Date(getString(claim, 'dateOfLoss') as string).toLocaleDateString() : '—'}
            />
            <Info label="Nature of Loss" value={getString(claim, 'natureOfLoss')} />
            <Info label="Location" value={getString(claim, 'locationOfLoss')} />
            <Info label="Received" value={new Date(getString(claim, 'dateReceived') as string).toLocaleDateString()} />
            <Info
              label="Date Inspected"
              value={getString(claim, 'dateInspected') ? new Date(getString(claim, 'dateInspected') as string).toLocaleDateString() : '—'}
            />
            <Info
              label="Letter Request"
              value={getString(claim, 'letterRequestDate') ? new Date(getString(claim, 'letterRequestDate') as string).toLocaleDateString() : '—'}
            />
            <Info
              label="Denial Letter"
              value={getString(claim, 'denialLetterDate') ? new Date(getString(claim, 'denialLetterDate') as string).toLocaleDateString() : '—'}
            />
          </div>
          {getString(claim, 'policyCoverageText') && (
            <div className="mt-4 pt-4 border-t border-surface-border">
              <span className="text-label-md text-outline uppercase">Policy Coverage / Sum Insured</span>
              <p className="text-body-md mt-1">{getString(claim, 'policyCoverageText')}</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-surface-border">
            <span className="text-label-md text-outline uppercase">Description</span>
            <p className="text-body-md mt-1">{getString(claim, 'description') ?? '—'}</p>
          </div>
          <DocumentPreview claimId={getId(claim, 'id') ?? ''} documents={getArray(claim, 'documents') ?? []} />
          <InspectionSummary claimId={getId(claim, 'id') ?? ''} inspections={getArray(claim, 'inspections') ?? []} />
        </section>

        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Financial Summary</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-body-md">
            <Info label="Estimated Loss" value={formatCurrency(getNumber(claim, 'estimatedLoss') as string | number | undefined)} money />
            <Info label="Reserve" value={formatCurrency(getNumber(claim, 'reserve') as string | number | undefined)} money />
            <Info label="Claimed Amount" value={formatCurrency((getNumber(claim, 'claimedAmount') as string | number | undefined) ?? getString(claim, 'claimedAmountRaw'))} money />
            <Info label="Proposed Settlement" value={formatCurrency((getNumber(claim, 'proposedSettlement') as string | number | undefined) ?? getString(claim, 'proposedSettlementRaw'))} money />
            <Info label="Agreed Settlement" value={formatCurrency((getNumber(claim, 'agreedSettlement') as string | number | undefined) ?? getString(claim, 'agreedSettlementRaw'))} money />
            <Info label="Assessment Total" value={formatCurrency(getNumber(fin, 'assessmentTotal') as string | number | undefined)} money />
            <Info label="Fee Total" value={formatCurrency(getNumber(fin, 'feeTotal') as string | number | undefined)} money />
            <Info label="Invoice Total" value={formatCurrency(getNumber(fin, 'invoiceTotal') as string | number | undefined)} money />
            <Info label="Payment Total" value={formatCurrency(getNumber(fin, 'paymentTotal') as string | number | undefined)} money />
          </div>
        </section>

        {getRecord(claim, 'importStatus') && (
          <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Historical Import Metadata</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-body-md">
              <Info label="OCS Import Status" value={getString(getRecord(claim, 'importStatus'), 'name')} />
              <Info label="Import Batch" value={getString(claim, 'importBatchId')} mono />
              <Info
                label="Imported At"
                value={getString(claim, 'importedAt') ? new Date(getString(claim, 'importedAt') as string).toLocaleString() : '—'}
              />
              <Info label="Cancelled" value={getBoolean(claim, 'isCancelled') ? 'Yes' : 'No'} />
              {!!getBoolean(claim, 'isCancelled') && <Info label="Cancellation Reason" value={getString(claim, 'cancellationReason')} />}
            </div>
            {getString(claim, 'remarksRaw') && (
              <div className="mt-4 pt-4 border-t border-surface-border">
                <span className="text-label-md text-outline uppercase">Original Remarks</span>
                <p className="text-body-md mt-1 whitespace-pre-wrap">{getString(claim, 'remarksRaw')}</p>
              </div>
            )}
            {getString(claim, 'latestStatusRaw') && (
              <div className="mt-4 pt-4 border-t border-surface-border">
                <span className="text-label-md text-outline uppercase">Original Latest Status</span>
                <p className="text-body-md mt-1 whitespace-pre-wrap">{getString(claim, 'latestStatusRaw')}</p>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="space-y-6">
        {nextStep && !isReadOnly && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
            <ArrowRight size={20} className="text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-label-md text-primary uppercase font-semibold tracking-wide">Next Step</p>
              <p className="text-body-md text-on-surface mt-1">{nextStep.action}</p>
              {nextStep.tab && nextStep.tab !== 'summary' && (
                <button
                  type="button"
                  onClick={() => onNavigateTab(nextStep.tab)}
                  className="mt-2 inline-flex items-center gap-1 text-body-sm text-primary font-medium hover:text-primary-container transition-colors"
                >
                  Go to {nextStep.tab.charAt(0).toUpperCase() + nextStep.tab.slice(1)}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}
        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Update Status</h3>
          </div>
          <form onSubmit={onTransition} className="space-y-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Status</label>
              <Select
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(String(value))}
                options={statuses.map((s) => {
                  const sCode = getString(s, 'code') ?? '';
                  const currentIdx = STATUS_ORDER.indexOf(statusCode ?? '');
                  const optionIdx = STATUS_ORDER.indexOf(sCode);
                  const isCancelledOption = sCode === 'CANCELLED';
                  const isBackward = !isCancelledOption && optionIdx < currentIdx;
                  const isCurrent = optionIdx === currentIdx;
                  return {
                    value: sCode,
                    label: `${getString(s, 'name') ?? ''}${isCurrent ? ' (current)' : isBackward ? ' — past' : ''}`,
                  };
                })}
              />
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <textarea
                value={statusNote}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setStatusNote(e.target.value)}
                rows={3}
                placeholder="Add transition notes..."
                className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors inline-flex items-center justify-center gap-2"
            >
              <GitBranch size={16} />
              Update Status
            </button>
          </form>
        </section>

        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Recent Activity</h3>
          </div>
          {timelineEvents.length ? (
            <ul className="space-y-3 text-body-sm">
              {timelineEvents.map((e) => {
                const Icon = EVENT_ICONS[e.type] ?? GitBranch;
                const badgeText =
                    e.type === 'status' ? 'text-success' : e.type === 'correspondence' ? 'text-secondary' : 'text-primary';
                return (
                  <li key={e.id} className="relative pl-6 pb-3 last:pb-0">
                    <span className={`absolute left-0 top-1 w-2 h-2 rounded-full ${badgeText.replace('text-', 'bg-')} ring-2 ring-surface`} />
                    <span className="absolute left-[3px] top-4 bottom-0 w-px bg-surface-border" />
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} className={`${badgeText} shrink-0`} />
                      <p className="font-medium text-on-surface">{e.title}</p>
                    </div>
                    {e.desc && <p className="text-on-surface-variant mt-0.5 text-body-sm">{e.desc}</p>}
                    <p className="text-label-sm text-outline mt-1 font-mono">
                      {e.actor ? `${e.actor} · ` : ''}
                      {e.date ? new Date(e.date).toLocaleString() : '—'}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-on-surface-variant text-body-sm">No activity yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

const PREVIEWABLE_MIME_TYPES: string[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
];

const DOCX_MIME_TYPES: string[] = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

function isPreviewable(mimeType: string | undefined): boolean {
  return !!mimeType && PREVIEWABLE_MIME_TYPES.includes(mimeType);
}

function isDocx(mimeType: string | undefined): boolean {
  return !!mimeType && DOCX_MIME_TYPES.includes(mimeType);
}

const DOCX_PREVIEW = { idle: 'idle', loading: 'loading', ready: 'ready', error: 'error' } as const;

interface DocumentPreviewProps {
  claimId: string | number;
  documents?: Data[];
}

export function DocumentPreview({ claimId, documents = [] }: DocumentPreviewProps) {
  const firstId = documents[0]?.['id'] as string | number | undefined;
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(firstId ? String(firstId) : '');
  const [docxHtml, setDocxHtml] = useState<string>('');
  const [docxStatus, setDocxStatus] = useState<string>(DOCX_PREVIEW.idle);

  const selectedDocument =
    documents.find((document) => String(document['id'] as string | number) === selectedId) || documents[0];
  const canPreview = selectedDocument ? isPreviewable(getString(selectedDocument, 'mimeType')) : false;
  const isDocxPreview = selectedDocument ? isDocx(getString(selectedDocument, 'mimeType')) : false;

  useEffect(() => {
    if (!open || !isDocxPreview || !selectedDocument) return;
    let cancelled = false;
    setDocxStatus(DOCX_PREVIEW.loading);
    setDocxHtml('');
    (async () => {
      try {
        const mammoth = await import('mammoth');
        const response = await fetch(`/api/claims/${claimId}/documents/${String(getId(selectedDocument, 'id') ?? '')}/preview`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!cancelled) {
          setDocxHtml((result.value as string | undefined) || '<p><em>This document has no readable content.</em></p>');
          setDocxStatus(DOCX_PREVIEW.ready);
        }
      } catch {
        if (!cancelled) setDocxStatus(DOCX_PREVIEW.error);
      }
    })();
    return () => { cancelled = true; };
  }, [open, isDocxPreview, claimId, selectedDocument]);

  return (
    <>
      <div className="mt-4 pt-4 border-t border-surface-border">
        <button
          type="button"
          onClick={() => documents.length > 0 && setOpen(true)}
          disabled={documents.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-body-sm font-medium hover:bg-primary/10 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileText size={14} />
          {documents.length} {documents.length === 1 ? 'Document' : 'Documents'}
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Document Preview" size="xl">
        {selectedDocument && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="summary-document-preview"
                  className="block text-label-md text-outline uppercase mb-1.5"
                >
                  Preview document
                </label>
                <Select
                  value={String(getId(selectedDocument, 'id') ?? '')}
                  onChange={(v) => setSelectedId(String(v))}
                  options={documents.map((document) => ({
                    value: String(getId(document, 'id') ?? ''),
                    label: `${getString(document, 'originalName')} — ${getString(document, 'category')}`,
                  }))}
                  ariaLabel="Preview document"
                />
              </div>
              <a
                href={authUrl(`/api/claims/${claimId}/documents/${String(getId(selectedDocument, 'id') ?? '')}/download`)}
                className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-lg border border-outline text-on-surface-variant font-medium hover:bg-surface-container-high hover:text-primary transition-colors"
              >
                <Download size={16} />
                Download
              </a>
            </div>
            {canPreview ? (
              <div className="border border-surface-border rounded-lg overflow-hidden bg-surface-container-low">
                <iframe
                  key={String(getId(selectedDocument, 'id') ?? '')}
                  src={getDocumentPreviewUrl(claimId, String(getId(selectedDocument, 'id') ?? ''))}
                  title="Document preview"
                  className="w-full h-[65vh] bg-white"
                />
              </div>
            ) : isDocxPreview ? (
              <div className="border border-surface-border rounded-lg bg-white overflow-y-auto h-[65vh] p-6">
                {docxStatus === DOCX_PREVIEW.loading && (
                  <p className="text-on-surface-variant text-body-md text-center py-8">Loading document...</p>
                )}
                {docxStatus === DOCX_PREVIEW.error && (
                  <div className="text-center py-8">
                    <FileText size={32} className="mx-auto text-on-surface-variant mb-3" />
                    <p className="text-on-surface-variant text-body-md">
                      Could not render this document inline.
                    </p>
                    <p className="text-on-surface-variant text-body-sm mt-1">
                      Use the Download button above to view the file.
                    </p>
                  </div>
                )}
                {docxStatus === DOCX_PREVIEW.ready && (
                  <div className="prose max-w-none text-on-surface whitespace-pre-wrap">
                    {stripHtml(docxHtml)}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-surface-border rounded-lg bg-surface-container-low p-10 text-center">
                <FileText size={32} className="mx-auto text-on-surface-variant mb-3" />
                <p className="text-on-surface-variant text-body-md">
                  Inline preview is not available for this file type.
                </p>
                <p className="text-on-surface-variant text-body-sm mt-1">
                  Use the Download button above to view the file.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-body-sm">
              <Info label="File" value={getString(selectedDocument, 'originalName')} />
              <Info label="Category" value={getString(selectedDocument, 'category')} />
              <Info label="Uploaded By" value={getString(selectedDocument, 'uploadedBy')} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

interface InspectionSummaryProps {
  claimId: string | number;
  inspections?: Data[];
}

export function InspectionSummary({ claimId, inspections = [] }: InspectionSummaryProps) {
  const [open, setOpen] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<Data | null>(null);

  useEffect(() => {
    if (!viewingPhoto) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setViewingPhoto(null);
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [viewingPhoto]);

  if (inspections.length === 0) return null;

  const inspection = inspections[0];
  const completed = !!getString(inspection, 'conductedAt');
  const inspectionDate = getString(inspection, 'conductedAt') || getString(inspection, 'scheduledAt');
  const inspectorRecord = getRecord(inspection, 'inspector');
  const inspector = inspectorRecord
    ? `${getString(inspectorRecord, 'firstName') ?? ''} ${getString(inspectorRecord, 'lastName') ?? ''}`.trim()
    : null;

  const photos = getArray(inspection, 'photos') ?? [];

  return (
    <>
      <div className="mt-4 pt-4 border-t border-surface-border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Latest Inspection</h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 border border-outline text-on-surface-variant rounded-lg text-body-sm font-medium hover:bg-surface-container-high hover:text-primary transition-colors"
          >
            <Eye size={16} />
            View Inspection
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-body-md">
          <Info label="Status" value={completed ? 'Completed' : 'Scheduled'} />
          <Info
            label={completed ? 'Conducted' : 'Scheduled For'}
            value={inspectionDate ? new Date(inspectionDate).toLocaleString() : '—'}
          />
          <Info label="Location" value={getString(inspection, 'location')} />
          <Info label="Inspector" value={inspector} />
        </div>
        {getString(inspection, 'findings') && (
          <div className="mt-4 pt-4 border-t border-surface-border">
            <span className="text-label-md text-outline uppercase">Findings</span>
            <p className="text-body-md mt-1 line-clamp-2">{getString(inspection, 'findings')}</p>
          </div>
        )}
        {photos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-surface-border">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-body-sm font-medium">
              <Camera size={14} />
              {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
            </span>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Inspection Details" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-body-md">
            <Info label="Status" value={completed ? 'Completed' : 'Scheduled'} />
            <Info
              label="Scheduled For"
              value={getString(inspection, 'scheduledAt') ? new Date(getString(inspection, 'scheduledAt') as string).toLocaleString() : '—'}
            />
            <Info
              label="Conducted"
              value={getString(inspection, 'conductedAt') ? new Date(getString(inspection, 'conductedAt') as string).toLocaleString() : '—'}
            />
            <Info label="Location" value={getString(inspection, 'location')} />
            <Info label="Inspector" value={inspector} />
            <Info label="Inspection ID" value={getId(inspection, 'id') as ReactNode} mono />
          </div>
          {getString(inspection, 'scope') && (
            <div className="pt-4 border-t border-surface-border">
              <span className="text-label-md text-outline uppercase">Scope</span>
              <p className="text-body-md mt-1 whitespace-pre-wrap">{getString(inspection, 'scope')}</p>
            </div>
          )}
          {getString(inspection, 'findings') && (
            <div className="pt-4 border-t border-surface-border">
              <span className="text-label-md text-outline uppercase">Findings</span>
              <p className="text-body-md mt-1 whitespace-pre-wrap">{getString(inspection, 'findings')}</p>
            </div>
          )}
          {getString(inspection, 'notes') && (
            <div className="pt-4 border-t border-surface-border">
              <span className="text-label-md text-outline uppercase">Notes</span>
              <p className="text-body-md mt-1 whitespace-pre-wrap">{getString(inspection, 'notes')}</p>
            </div>
          )}
          {photos.length > 0 && (
            <div className="pt-4 border-t border-surface-border">
              <div className="flex items-center gap-2 mb-3">
                <Camera size={16} className="text-primary" />
                <span className="text-label-md text-outline uppercase">Photos ({photos.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {photos.map((photo) => (
                  <figure key={String(getId(photo, 'id') ?? '')} className="border border-surface-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setViewingPhoto(photo)}
                      className="w-full block cursor-zoom-in"
                      title="Click to view full size"
                    >
                      <img
                        src={authUrl(`/api/claims/${claimId}/inspections/photos/${String(getId(photo, 'id') ?? '')}`)}
                        alt={getString(photo, 'originalName')}
                        className="w-full h-48 object-cover bg-surface-container-high"
                      />
                    </button>
                    <figcaption className="p-3 text-body-sm">
                      <p className="font-medium text-on-surface break-words">{getString(photo, 'originalName')}</p>
                      {getString(photo, 'caption') && <p className="text-on-surface-variant mt-1">{getString(photo, 'caption')}</p>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {viewingPhoto && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div
            className="bg-surface rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="min-w-0">
                <p className="text-body-md font-semibold text-on-surface truncate">{getString(viewingPhoto, 'originalName')}</p>
                {getString(viewingPhoto, 'caption') && (
                  <p className="text-body-sm text-on-surface-variant truncate">{getString(viewingPhoto, 'caption')}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={authUrl(`/api/claims/${claimId}/inspections/photos/${String(getId(viewingPhoto, 'id') ?? '')}`)}
                  download={getString(viewingPhoto, 'originalName')}
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
                src={authUrl(`/api/claims/${claimId}/inspections/photos/${String(getId(viewingPhoto, 'id') ?? '')}`)}
                alt={getString(viewingPhoto, 'originalName')}
                className="max-w-full max-h-[65vh] rounded-lg object-contain"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

interface DocumentsTabProps {
  claimId: string | number;
  onClaimChange?: () => void;
}

function DocumentsTab({ claimId, onClaimChange }: DocumentsTabProps) {
  const [checklist, setChecklist] = useState<Data[]>([]);
  const [categories, setCategories] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docData, catData] = await Promise.all([getDocuments(claimId), getDocumentCategories()]);
      setChecklist(((docData as Data)['items'] as Data[] | undefined) ?? []);
      setCategories(((catData as Data)['items'] as Data[] | undefined) ?? []);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !categoryId) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentCategoryId', categoryId);
      formData.append('description', desc);
      await uploadDocument(claimId, formData);
      setFile(null);
      setCategoryId('');
      setDesc('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleMark = (docId: string | number) => async () => {
    try {
      await markDocumentReceived(claimId, docId);
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to mark document as received');
    }
  };

  const handleDelete = (docId: string | number) => async () => {
    if (!confirm('Delete this document? The file will be permanently removed.')) return;
    try {
      await deleteDocument(claimId, docId);
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to delete document');
    }
  };

  const handleDownload = async (docId: string | number, filename: string | undefined) => {
    try {
      const response = await downloadDocument(claimId, docId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename ?? 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download document');
    }
  };

  const totalDocs = checklist.reduce((sum, group) => sum + (getArray(group, 'uploaded')?.length ?? 0), 0);
  const receivedDocs = checklist.reduce(
    (sum, group) =>
      sum +
      (getArray(group, 'uploaded')?.filter((d) => !!getBoolean(d, 'isReceived')).length ?? 0),
    0
  );

  function formatFileSize(bytes: number | undefined): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileIcon(mimeType: string | undefined): ReactNode {
    if (!mimeType) return <FileText size={16} className="text-on-surface-variant" />;
    if (mimeType.startsWith('image/')) return <File size={16} className="text-primary" />;
    if (mimeType.includes('pdf')) return <FileText size={16} className="text-error" />;
    return <FileText size={16} className="text-on-surface-variant" />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-body-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-error hover:opacity-70">
            <AlertTriangle size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FolderOpen size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Total Documents</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{totalDocs}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <FileCheck size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Received</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{receivedDocs}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Pending</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{totalDocs - receivedDocs}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpload} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">Upload Document</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-3">
            <label className="block text-label-md text-outline uppercase mb-1.5">File</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/40 bg-primary/5">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-on-surface truncate">{file.name}</p>
                  <p className="text-label-md text-on-surface-variant">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="p-1.5 rounded text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0"
                  title="Remove file"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e: DragEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e: DragEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  setDragging(false);
                  if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
                }}
                className={`w-full flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-lg border-2 border-dashed transition-colors ${
                  dragging
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-low'
                }`}
              >
                <UploadCloud size={28} className={dragging ? 'text-primary' : 'text-outline'} />
                <div className="text-center">
                  <p className="text-body-md font-medium">
                    {dragging ? 'Drop file to upload' : 'Click to browse or drag a file here'}
                  </p>
                  <p className="text-label-md text-outline mt-0.5">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
                  </p>
                </div>
              </button>
            )}
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Category</label>
            <Select
              value={categoryId}
              onChange={(v) => setCategoryId(v as string)}
              options={[
                { value: '', label: 'Select category' },
                ...categories.map((c) => ({
                  value: getId(c, 'id')?.toString() ?? '',
                  label: getString(c, 'name') ?? '',
                })),
              ]}
              placeholder="Select category"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-label-md text-outline uppercase mb-1.5">Description</label>
            <input
              type="text"
              value={desc}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)}
              placeholder="Document description..."
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={uploading || !file || !categoryId}
          className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FolderOpen size={16} />
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {loading ? (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
          <p className="text-body-md text-on-surface-variant">Loading documents...</p>
        </div>
      ) : checklist.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
          <FolderOpen size={32} className="text-outline mx-auto mb-2" />
          <p className="text-body-md text-on-surface-variant">No document categories configured for this claim type.</p>
        </div>
      ) : (
        checklist.map((group) => {
          const category = getRecord(group, 'category');
          const docs = getArray(group, 'uploaded') ?? [];
          const receivedCount = docs.filter((d) => !!getBoolean(d, 'isReceived')).length;
          return (
            <div key={String(getId(category, 'id') ?? 'unknown')} className="bg-surface border border-surface-border rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen size={16} className="text-primary shrink-0" />
                  <h4 className="text-body-md font-semibold text-primary truncate">{getString(category, 'name') || 'Uncategorized'}</h4>
                  {!!getBoolean(group, 'isRequired') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-medium bg-error/10 text-error">
                      Required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-label-sm text-on-surface-variant font-mono">
                    {docs.length} file{docs.length !== 1 ? 's' : ''}
                    {docs.length > 0 && ` · ${receivedCount} received`}
                  </span>
                </div>
              </div>

              <div className="p-3">
                {docs.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant py-2">No documents uploaded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {docs.map((doc) => (
                      <li key={String(getId(doc, 'id') ?? '')} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-surface-border">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                            {fileIcon(getString(doc, 'mimeType'))}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-body-sm font-medium text-on-surface truncate">{getString(doc, 'originalName')}</p>
                              {!!getBoolean(doc, 'isReceived') && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-sm font-medium bg-success/10 text-success shrink-0">
                                  <CheckCircle size={10} />
                                  Received
                                </span>
                              )}
                            </div>
                            <p className="text-label-sm text-outline mt-0.5">
                              {getString(doc, 'description') || 'No description'}
                              {' · '}
                              <span className="font-mono">{formatFileSize(getNumber(doc, 'size'))}</span>
                              {' · '}
                              {new Date(getString(doc, 'createdAt') as string).toLocaleDateString()}
                              {getString(doc, 'uploadedBy') && ` · ${getString(doc, 'uploadedBy')}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDownload(getId(doc, 'id') ?? '', getString(doc, 'originalName'))}
                            className="inline-flex items-center justify-center w-8 h-8 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {!getBoolean(doc, 'isReceived') && (
                            <button
                              onClick={handleMark(getId(doc, 'id') ?? '')}
                              className="inline-flex items-center justify-center w-8 h-8 rounded text-success hover:bg-success/10 transition-colors"
                              title="Mark received"
                            >
                              <FileCheck size={16} />
                            </button>
                          )}
                          <button
                            onClick={handleDelete(getId(doc, 'id') ?? '')}
                            className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

interface AssessmentTabProps {
  claimId: string | number;
  onClaimChange?: () => void;
}

function AssessmentTab({ claimId, onClaimChange }: AssessmentTabProps) {
  const [assessments, setAssessments] = useState<Data[]>([]);
  const [items, setItems] = useState<Data[]>([{ description: '', quantity: 1, unitCost: 0 }]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await getAssessments(claimId)) as Data;
      setAssessments((data['items'] as Data[] | undefined) ?? []);
    } catch {
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitCost: 0 }]);

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: 'description' | 'quantity' | 'unitCost', value: string) => {
    const next = [...items];
    const row = next[idx];
    if (!row) return;
    row[field] = field === 'description' ? value : Number(value);
    setItems(next);
  };

  const total = items.reduce(
    (sum, it) => sum + ((getNumber(it, 'quantity') ?? 0) * (getNumber(it, 'unitCost') ?? 0)),
    0
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAssessment(claimId, { notes, items });
      setNotes('');
      setItems([{ description: '', quantity: 1, unitCost: 0 }]);
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Delete this assessment and all its line items?')) return;
    try {
      await deleteAssessment(claimId, id);
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to delete assessment');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-body-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCheck size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">New Assessment</h3>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_80px_120px_40px] gap-2 text-label-md text-outline uppercase font-medium">
            <span>Description</span>
            <span className="text-center">Qty</span>
            <span className="text-center">Unit Cost</span>
            <span></span>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_120px_40px] gap-2 items-center">
              <input
                type="text"
                value={getString(it, 'description') ?? ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateItem(idx, 'description', e.target.value)}
                placeholder="Item description"
                className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                required
              />
              <input
                type="number"
                value={getNumber(it, 'quantity') ?? 1}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateItem(idx, 'quantity', e.target.value)}
                placeholder="0"
                min={1}
                className="h-10 px-3 rounded border border-outline bg-surface text-body-md text-center font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                required
              />
              <input
                type="number"
                step="0.01"
                value={getNumber(it, 'unitCost') ?? 0}
                onChange={(e: ChangeEvent<HTMLInputElement>) => updateItem(idx, 'unitCost', e.target.value)}
                placeholder="0.00"
                min={0}
                className="h-10 px-3 rounded border border-outline bg-surface text-body-md text-right font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                disabled={items.length === 1}
                className="w-10 h-10 flex items-center justify-center rounded text-error hover:bg-error/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Remove line"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1.5 text-primary text-body-md font-semibold hover:underline">
            <Plus size={16} />
            Add Line
          </button>
          <p className="font-mono text-headline-lg font-semibold text-primary">Total: {formatCurrency(total)}</p>
        </div>

        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
          <textarea
            value={notes}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Assessment notes..."
            className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
            rows={2}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ClipboardCheck size={16} />
          {saving ? 'Saving...' : 'Save Assessment'}
        </button>
      </form>

      {loading ? (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
          <p className="text-body-md text-on-surface-variant">Loading assessments...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
          <ClipboardCheck size={32} className="text-outline mx-auto mb-2" />
          <p className="text-body-md text-on-surface-variant">No assessments recorded yet.</p>
          <p className="text-body-sm text-outline mt-1">Use the form above to create one.</p>
        </div>
      ) : (
        assessments.map((a) => (
          <div key={String(getId(a, 'id') ?? '')} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-surface-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ClipboardCheck size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-body-md font-semibold text-on-surface">Assessment #{getId(a, 'id') as ReactNode}</p>
                  <p className="text-label-sm text-outline font-mono mt-0.5">
                    {getString(a, 'assessmentDate') ? new Date(getString(a, 'assessmentDate') as string).toLocaleString() : '—'}
                    {getString(getRecord(a, 'preparedBy'), 'firstName') && ` · ${getString(getRecord(a, 'preparedBy'), 'firstName')} ${getString(getRecord(a, 'preparedBy'), 'lastName')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="font-mono text-headline-sm font-semibold text-primary">{formatCurrency(getNumber(a, 'totalAmount') as string | number | undefined)}</p>
                <button
                  onClick={() => handleDelete(getId(a, 'id') ?? '')}
                  className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                  title="Delete assessment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {getString(a, 'notes') && (
                <div>
                  <span className="text-label-md text-outline uppercase">Notes</span>
                  <p className="text-body-sm text-on-surface mt-0.5">{getString(a, 'notes')}</p>
                </div>
              )}
              <div>
                <span className="text-label-md text-outline uppercase">Line Items</span>
                <ul className="mt-1 divide-y divide-surface-border text-body-sm">
                  {(getArray(a, 'items') ?? []).map((it) => (
                    <li key={String(getId(it, 'id') ?? '')} className="py-2 flex justify-between items-center gap-3">
                      <span className="text-on-surface truncate">{getString(it, 'description')}</span>
                      <span className="text-on-surface-variant font-mono text-body-sm whitespace-nowrap">
                        {getNumber(it, 'quantity') as ReactNode} × {formatCurrency(getNumber(it, 'unitCost') as string | number | undefined)}
                      </span>
                      <span className="font-mono text-on-surface font-medium min-w-[100px] text-right whitespace-nowrap">
                        {formatCurrency(getNumber(it, 'amount') as string | number | undefined)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {Number(getNumber(a, 'depreciation') ?? 0) > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-surface-border">
                  <span className="text-label-md text-outline uppercase">Depreciation</span>
                  <span className="font-mono text-body-sm text-on-surface-variant">-{formatCurrency(getNumber(a, 'depreciation') as string | number | undefined)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-surface-border">
                <span className="text-label-md text-outline uppercase font-medium">Total</span>
                <span className="font-mono text-headline-sm font-semibold text-primary">{formatCurrency(getNumber(a, 'totalAmount') as string | number | undefined)}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface SettlementTabProps {
  claimId: string | number;
  onClaimChange?: () => void;
}

interface SettlementStatusColor {
  bg: string;
  text: string;
  dot: string;
}

interface SettlementForm {
  settledAmount: string;
  settlementDate: string;
  status: string;
  notes: string;
}

interface OfferForm {
  offeredAmount: string;
  notes: string;
}

const SETTLEMENT_STATUS_COLORS: Record<string, SettlementStatusColor> = {
  PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  AGREED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  REJECTED: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
};

const OFFER_STATUS_COLORS: Record<string, SettlementStatusColor> = {
  PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  ACCEPTED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  REJECTED: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
  COUNTERED: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
};

function SettlementTab({ claimId, onClaimChange }: SettlementTabProps) {
  const [offers, setOffers] = useState<Data[]>([]);
  const [settlement, setSettlement] = useState<Data | null>(null);
  const [form, setForm] = useState<SettlementForm>({ settledAmount: '', settlementDate: '', status: 'PENDING', notes: '' });
  const [offerForm, setOfferForm] = useState<OfferForm>({ offeredAmount: '', notes: '' });
  const [response, setResponse] = useState<Record<string, Data>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, o] = await Promise.all([getSettlement(claimId), getOffers(claimId)]);
      const settlementData = s as Data;
      const offersData = o as Data;
      const settlementItem = getRecord(settlementData, 'item');
      if (settlementItem) {
        setSettlement(settlementItem);
        setForm({
          settledAmount: getNumber(settlementItem, 'settledAmount')?.toString() || '',
          settlementDate: (getString(settlementItem, 'settlementDate') ?? '').slice(0, 10),
          status: getString(settlementItem, 'status') || 'PENDING',
          notes: getString(settlementItem, 'notes') || '',
        });
      } else {
        setSettlement(null);
      }
      setOffers((offersData['items'] as Data[] | undefined) ?? []);
    } catch {
      setError('Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveSettlement(claimId, form as unknown as Record<string, unknown>);
      await load();
      onClaimChange?.();
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.error : undefined;
      setError(message || 'Failed to save settlement');
    } finally {
      setSaving(false);
    }
  };

  const handleOffer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!offerForm.offeredAmount) return;
    const amount = Number(offerForm.offeredAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Offered amount must be a valid non-negative number.');
      return;
    }
    if (amount > 9999999999999.99) {
      setError('Offered amount is too large (max ₱9,999,999,999,999.99).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createOffer(claimId, offerForm as unknown as Record<string, unknown>);
      setOfferForm({ offeredAmount: '', notes: '' });
      await load();
      onClaimChange?.();
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.error : undefined;
      setError(message || 'Failed to create offer');
    } finally {
      setSaving(false);
    }
  };

  const handleResponse = async (offerId: string | number) => {
    const r = response[String(offerId)];
    if (!r || !getString(r, 'status')) return;
    setSaving(true);
    setError(null);
    try {
      await respondToOffer(claimId, offerId, r);
      setResponse({ ...response, [String(offerId)]: {} });
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to respond to offer');
    } finally {
      setSaving(false);
    }
  };

  function StatusPill({ status, colors }: { status: string; colors: Record<string, SettlementStatusColor> }) {
    const c = colors[status] ?? { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
        {status}
      </span>
    );
  }

  const acceptedOffer = offers.find((o) => getString(o, 'status') === 'ACCEPTED');

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-body-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Handshake size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Settled</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono">{formatCurrency((getNumber(settlement, 'settledAmount') as string | number | undefined) ?? 0)}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Offers</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{offers.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Accepted</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono">{formatCurrency((getNumber(acceptedOffer, 'offeredAmount') as string | number | undefined) ?? 0)}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Status</p>
            <p className="text-headline-sm font-semibold text-on-surface">{getString(settlement, 'status') || 'PENDING'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-4 bg-surface-container-low border-b border-surface-border">
              <Handshake size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Settlement</h3>
              {settlement && <StatusPill status={getString(settlement, 'status') ?? 'PENDING'} colors={SETTLEMENT_STATUS_COLORS} />}
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-md text-outline uppercase mb-1.5">Settlement Date</label>
                  <input
                    type="date"
                    value={form.settlementDate}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, settlementDate: e.target.value })}
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-label-md text-outline uppercase mb-1.5">Settled Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.settledAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, settledAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Status</label>
                <Select
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v as string })}
                  options={[
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'AGREED', label: 'Agreed' },
                    { value: 'REJECTED', label: 'Rejected' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Settlement notes..."
                  className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full h-10 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Handshake size={16} />
                {saving ? 'Saving...' : 'Save Settlement'}
              </button>
            </form>
          </section>

          <section className="bg-surface border border-surface-border border-l-4 border-l-accent-orange rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-4 bg-surface-container-low border-b border-surface-border">
              <Plus size={18} className="text-accent-orange" />
              <h3 className="text-headline-sm font-semibold text-primary">New Offer</h3>
            </div>
            <form onSubmit={handleOffer} className="p-4 space-y-3">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Offered Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="9999999999999.99"
                  value={offerForm.offeredAmount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setOfferForm({ ...offerForm, offeredAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
                <textarea
                  value={offerForm.notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setOfferForm({ ...offerForm, notes: e.target.value })}
                  placeholder="Offer notes..."
                  className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full h-10 bg-accent-orange text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                {saving ? 'Creating...' : 'Create Offer'}
              </button>
            </form>
          </section>
        </div>

        <section className="bg-surface border border-surface-border rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 p-4 bg-surface-container-low border-b border-surface-border">
            <Handshake size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Offers ({offers.length})</h3>
          </div>
          <div className="p-4 space-y-3">
            {loading ? (
              <p className="text-body-md text-on-surface-variant text-center py-8">Loading offers...</p>
            ) : offers.length === 0 ? (
              <div className="text-center py-8">
                <Handshake size={32} className="text-outline mx-auto mb-2" />
                <p className="text-body-md text-on-surface-variant">No offers yet.</p>
                <p className="text-body-sm text-outline mt-1">Use the form on the left to create one.</p>
              </div>
            ) : (
              offers.map((o) => {
                const offerId = String(getId(o, 'id') ?? '');
                const createdBy = getRecord(o, 'createdBy');
                const responseBy = getRecord(o, 'responseBy');
                return (
                  <div key={offerId} className="bg-surface-container-low border border-surface-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-surface-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0">
                          <Handshake size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-body-md font-semibold text-on-surface">{formatCurrency((getNumber(o, 'offeredAmount') as string | number | undefined) ?? 0)}</p>
                          <p className="text-label-sm text-outline font-mono mt-0.5">
                            {new Date((getString(o, 'createdAt') || getString(o, 'offerDate')) as string).toLocaleDateString()}
                            {getString(createdBy, 'firstName') && ` · ${getString(createdBy, 'firstName')} ${getString(createdBy, 'lastName')}`}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={getString(o, 'status') ?? 'PENDING'} colors={OFFER_STATUS_COLORS} />
                    </div>

                    <div className="p-3 space-y-2">
                      {getString(o, 'notes') && (
                        <div>
                          <span className="text-label-md text-outline uppercase">Notes</span>
                          <p className="text-body-sm text-on-surface mt-0.5">{getString(o, 'notes')}</p>
                        </div>
                      )}

                      {getString(o, 'status') !== 'PENDING' && (
                        <div className="pt-2 border-t border-surface-border">
                          <span className="text-label-md text-outline uppercase">Response</span>
                          <p className="text-body-sm text-on-surface mt-0.5">
                            {getString(o, 'responseDate') && <span className="font-mono">{new Date(getString(o, 'responseDate') as string).toLocaleDateString()}</span>}
                            {getString(responseBy, 'firstName') && ` · ${getString(responseBy, 'firstName')} ${getString(responseBy, 'lastName')}`}
                          </p>
                        </div>
                      )}

                      {getString(o, 'status') === 'PENDING' && (
                        <div className="pt-2 border-t border-surface-border space-y-2">
                          <span className="text-label-md text-outline uppercase font-medium">Respond to Offer</span>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={getString(response[offerId], 'status') || ''}
                              onChange={(v) => setResponse({ ...response, [offerId]: { ...response[offerId], status: v as string } })}
                              options={[
                                { value: '', label: 'Select response' },
                                { value: 'ACCEPTED', label: 'Accept' },
                                { value: 'REJECTED', label: 'Reject' },
                                { value: 'COUNTERED', label: 'Counter' },
                              ]}
                              placeholder="Select response"
                            />
                            <input
                              type="text"
                              value={getString(response[offerId], 'notes') || ''}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setResponse({ ...response, [offerId]: { ...response[offerId], notes: e.target.value } })}
                              placeholder="Response notes"
                              className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                            />
                          </div>
                          <button
                            onClick={() => handleResponse(getId(o, 'id') ?? '')}
                            disabled={saving || !getString(response[offerId], 'status')}
                            className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle size={16} />
                            Submit Response
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

interface ReportsTabProps {
  claimId: string | number;
  onClaimChange?: () => void;
}

interface ReportStatusColor {
  bg: string;
  text: string;
  dot: string;
}

const REPORT_STATUS_COLORS: Record<string, ReportStatusColor> = {
  DRAFT: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' },
  SUBMITTED: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  UNDER_REVIEW: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
  APPROVED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
  REJECTED: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
  CLARIFICATION_REQUESTED: { bg: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
};

function ReportsTab({ claimId, onClaimChange }: ReportsTabProps) {
  const [reports, setReports] = useState<Data[]>([]);
  const [title, setTitle] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [clarification, setClarification] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await getReports(claimId)) as Data;
      setReports((data['items'] as Data[] | undefined) ?? []);
    } catch {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createReport(claimId, { title, notes });
      setTitle('');
      setNotes('');
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to create report draft');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (reportId: string | number) => {
    setGenerating(reportId);
    setError(null);
    try {
      await generateReport(claimId, reportId);
      await load();
      onClaimChange?.();
    } catch (err) {
      const serverMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate report: ${serverMsg}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleClarify = async (reportId: string | number) => {
    const q = clarification[String(reportId)]?.trim();
    if (!q) return;
    setSaving(true);
    setError(null);
    try {
      await askClarification(claimId, reportId, { question: q });
      setClarification({ ...clarification, [String(reportId)]: '' });
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to send clarification request');
    } finally {
      setSaving(false);
    }
  };

  function StatusPill({ status }: { status: string }) {
    const c = REPORT_STATUS_COLORS[status] ?? { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
        {status?.replace(/_/g, ' ')}
      </span>
    );
  }

  const draftCount = reports.filter((r) => getString(r, 'status') === 'DRAFT').length;
  const submittedCount = reports.filter((r) => getString(r, 'status') !== 'DRAFT').length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-body-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-error hover:opacity-70 shrink-0">
            <AlertTriangle size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileBarChart size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Total Reports</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{reports.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Drafts</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{draftCount}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Submitted</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{submittedCount}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <FileBarChart size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">New Report Draft</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Enter report title..."
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Notes / Summary</label>
          <textarea
            value={notes}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Report summary and notes..."
            className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
            rows={2}
          />
        </div>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {saving ? 'Creating...' : 'Create Draft'}
        </button>
      </form>

      {loading ? (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
          <p className="text-body-md text-on-surface-variant">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
          <FileBarChart size={32} className="text-outline mx-auto mb-2" />
          <p className="text-body-md text-on-surface-variant">No reports created yet.</p>
          <p className="text-body-sm text-outline mt-1">Use the form above to create a report draft.</p>
        </div>
      ) : (
        reports.map((r) => {
          const reportId = getId(r, 'id') ?? '';
          const generatedBy = getRecord(r, 'generatedBy');
          return (
            <div key={String(reportId)} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-surface-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileBarChart size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-md font-semibold text-on-surface truncate">{getString(r, 'title')}</p>
                    <p className="text-label-sm text-outline font-mono mt-0.5">
                      Created {new Date(getString(r, 'createdAt') as string).toLocaleDateString()}
                      {getString(r, 'generatedAt') && ' · Generated ' + new Date(getString(r, 'generatedAt') as string).toLocaleDateString()}
                      {getString(generatedBy, 'firstName') && ` · ${getString(generatedBy, 'firstName')} ${getString(generatedBy, 'lastName')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusPill status={getString(r, 'status') ?? ''} />
                </div>
              </div>

              <div className="p-4 space-y-3">
                {getString(r, 'notes') && (
                  <div>
                    <span className="text-label-md text-outline uppercase">Summary</span>
                    <p className="text-body-sm text-on-surface mt-0.5">{getString(r, 'notes')}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border">
                  {getString(r, 'status') === 'DRAFT' && (
                    <button
                      onClick={() => handleGenerate(reportId)}
                      disabled={generating === reportId}
                      className="h-9 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileBarChart size={16} />
                      {generating === reportId ? 'Generating...' : 'Generate Report'}
                    </button>
                  )}
                  {getString(r, 'pdfPath') && (
                    <a
                      href={getDownloadUrl(claimId, reportId, 'pdf')}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download PDF
                    </a>
                  )}
                  {getString(r, 'docxPath') && (
                    <a
                      href={getDownloadUrl(claimId, reportId, 'docx')}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-4 bg-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download DOCX
                    </a>
                  )}
                </div>

                {getString(r, 'status') !== 'DRAFT' && (
                  <div className="pt-3 border-t border-surface-border space-y-2">
                    <span className="text-label-md text-outline uppercase font-medium">Request Clarification</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={clarification[String(reportId)] || ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setClarification({ ...clarification, [String(reportId)]: e.target.value })}
                        placeholder="Ask a clarification question..."
                        className="flex-1 h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                      />
                      <button
                        onClick={() => handleClarify(reportId)}
                        disabled={saving || !(clarification[String(reportId)] || '').trim()}
                        className="h-10 px-4 bg-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <GitBranch size={16} />
                        Ask
                      </button>
                    </div>
                  </div>
                )}

                {(getArray(r, 'clarifications')?.length ?? 0) > 0 && (
                  <div className="pt-3 border-t border-surface-border">
                    <span className="text-label-md text-outline uppercase">Clarifications</span>
                    <ul className="mt-2 space-y-2">
                      {(getArray(r, 'clarifications') ?? []).map((cl) => {
                        const askedBy = getRecord(cl, 'askedBy');
                        const answeredBy = getRecord(cl, 'answeredBy');
                        return (
                          <li key={String(getId(cl, 'id') ?? '')} className="p-3 bg-surface-container-low rounded-lg border border-surface-border">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-medium ${
                                getString(cl, 'status') === 'ANSWERED' ? 'bg-success/10 text-success' : 'bg-accent-orange/10 text-accent-orange'
                              }`}>
                                {getString(cl, 'status') === 'ANSWERED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                {getString(cl, 'status')}
                              </span>
                              <span className="text-label-sm text-outline font-mono">
                                {new Date(getString(cl, 'createdAt') as string).toLocaleDateString()}
                                {getString(askedBy, 'firstName') && ` · ${getString(askedBy, 'firstName')} ${getString(askedBy, 'lastName')}`}
                              </span>
                            </div>
                            <p className="text-body-sm text-on-surface">
                              <span className="text-on-surface-variant">Q:</span> {getString(cl, 'question')}
                            </p>
                            {getString(cl, 'answer') && (
                              <p className="text-body-sm text-on-surface mt-1">
                                <span className="text-on-surface-variant">A:</span> {getString(cl, 'answer')}
                                {getString(answeredBy, 'firstName') && <span className="text-outline ml-2">· {getString(answeredBy, 'firstName')} {getString(answeredBy, 'lastName')}</span>}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {(getArray(r, 'versions')?.length ?? 0) > 0 && (
                  <div className="pt-3 border-t border-surface-border">
                    <span className="text-label-md text-outline uppercase">Versions</span>
                    <ul className="mt-2 space-y-1">
                      {(getArray(r, 'versions') ?? []).map((v) => (
                        <li key={String(getId(v, 'id') ?? '')} className="flex items-center justify-between p-2 bg-surface-container-low rounded text-body-sm">
                          <span className="text-on-surface">
                            Version {getNumber(v, 'versionNumber') as ReactNode}
                            <span className="text-on-surface-variant ml-2 font-mono">
                              {new Date(getString(v, 'generatedAt') as string).toLocaleString()}
                            </span>
                          </span>
                          <div className="flex items-center gap-1">
                            {getString(v, 'pdfPath') && (
                              <a
                                href={getDownloadUrl(claimId, reportId, 'pdf')}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center w-7 h-7 rounded text-primary hover:bg-primary/10 transition-colors"
                                title="Download PDF"
                              >
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

interface StatusColor {
  bg: string;
  text: string;
}

interface InsurerPanelTabProps {
  claim: Data;
  claimId: string | number;
  isAdmin: boolean;
  onClaimChange?: () => void;
}

const OFFER_STATUS_COLORS_INSURER: Record<string, StatusColor> = {
  PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange' },
  ACCEPTED: { bg: 'bg-success/10', text: 'text-success' },
  REJECTED: { bg: 'bg-error/10', text: 'text-error' },
  COUNTERED: { bg: 'bg-primary/10', text: 'text-primary' },
};

const PAYMENT_STATUS_COLORS_INSURER: Record<string, StatusColor> = {
  PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange' },
  PARTIAL: { bg: 'bg-primary/10', text: 'text-primary' },
  PAID: { bg: 'bg-success/10', text: 'text-success' },
  NONE: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
};

function InsurerPanelTab({ claim: initialClaim, claimId, isAdmin, onClaimChange }: InsurerPanelTabProps) {
  const [insurers, setInsurers] = useState<Data[]>([]);
  const [panel, setPanel] = useState<Data[]>(getArray(initialClaim, 'insurerPanel') ?? []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState<Data>({
    insuranceCompanyId: '',
    isLead: false,
    participationPercent: '',
    insurerClaimNumber: '',
    proposedSettlement: '',
    agreedSettlement: '',
    paidAmount: '',
    offerStatus: '',
    paymentStatus: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formValue = (key: string): string => (form[key] as string | undefined) ?? '';

  const loadInsurers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = (await getInsuranceCompanies()) as Data;
      setInsurers((res['items'] as Data[] | undefined) ?? []);
    } catch {
      setError('Failed to load insurance companies');
    }
  }, [isAdmin]);

  const loadPanel = useCallback(async () => {
    try {
      const res = (await getClaim(claimId)) as Data;
      setPanel(getArray(getRecord(res, 'item'), 'insurerPanel') ?? []);
    } catch {
      setError('Failed to load insurer panel');
    }
  }, [claimId]);

  useEffect(() => {
    loadInsurers();
  }, [loadInsurers]);

  const resetForm = () => {
    setForm({
      insuranceCompanyId: '',
      isLead: false,
      participationPercent: '',
      insurerClaimNumber: '',
      proposedSettlement: '',
      agreedSettlement: '',
      paidAmount: '',
      offerStatus: '',
      paymentStatus: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formValue('insuranceCompanyId')) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateClaimInsurer(claimId, editingId, form);
      } else {
        await addClaimInsurer(claimId, form);
      }
      resetForm();
      await loadPanel();
      onClaimChange?.();
    } catch {
      setError(editingId ? 'Failed to update insurer' : 'Failed to add insurer');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (ci: Data) => {
    const company = getRecord(ci, 'insuranceCompany');
    setEditingId(getId(ci, 'id') ?? null);
    setShowForm(true);
    setForm({
      insuranceCompanyId: getId(company, 'id')?.toString() ?? '',
      isLead: !!getBoolean(ci, 'isLead'),
      participationPercent: (getNumber(ci, 'participationPercent') as string | number | undefined)?.toString() ?? '',
      insurerClaimNumber: getString(ci, 'insurerClaimNumber') ?? '',
      proposedSettlement: (getNumber(ci, 'proposedSettlement') as string | number | undefined)?.toString() ?? '',
      agreedSettlement: (getNumber(ci, 'agreedSettlement') as string | number | undefined)?.toString() ?? '',
      paidAmount: (getNumber(ci, 'paidAmount') as string | number | undefined)?.toString() ?? '',
      offerStatus: getString(ci, 'offerStatus') ?? '',
      paymentStatus: getString(ci, 'paymentStatus') ?? '',
      notes: getString(ci, 'notes') ?? '',
    });
  };

  const handleToggleLead = async (ci: Data) => {
    setSaving(true);
    setError(null);
    try {
      await updateClaimInsurer(claimId, getId(ci, 'id') ?? '', { isLead: !getBoolean(ci, 'isLead') });
      await loadPanel();
      onClaimChange?.();
    } catch {
      setError('Failed to toggle lead status');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (ci: Data) => {
    const companyName = getString(getRecord(ci, 'insuranceCompany'), 'name');
    if (!confirm(`Remove ${companyName ?? 'this insurer'} from the panel?`)) return;
    setSaving(true);
    setError(null);
    try {
      await removeClaimInsurer(claimId, getId(ci, 'id') ?? '');
      await loadPanel();
      onClaimChange?.();
    } catch {
      setError('Failed to remove insurer');
    } finally {
      setSaving(false);
    }
  };

  const leadInsurer = panel.find((ci) => !!getBoolean(ci, 'isLead'));
  const totalParticipation = panel.reduce((sum, ci) => sum + Number(getString(ci, 'participationPercent') ?? getNumber(ci, 'participationPercent') ?? 0), 0);

  function StatusBadge({ status, colors }: { status: string | undefined; colors: Record<string, StatusColor> }) {
    if (!status) return <span className="text-on-surface-variant">—</span>;
    const c = colors[status] ?? { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-label-md font-medium ${c.bg} ${c.text}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-body-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-error hover:opacity-70 shrink-0">
            <AlertTriangle size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Insurers</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{panel.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Lead Insurer</p>
            <p className="text-body-sm font-semibold text-on-surface truncate">{getString(getRecord(leadInsurer, 'insuranceCompany'), 'name') || 'None'}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Total Participation</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{totalParticipation}%</p>
          </div>
        </div>
      </div>

      <section className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Insurer Panel</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-body-sm font-semibold hover:bg-primary-container transition-colors"
            >
              <Plus size={16} />
              {showForm ? 'Cancel' : 'Add Insurer'}
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <form onSubmit={handleAdd} className="p-4 bg-surface-container-low border-b border-surface-border space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={16} className="text-primary" />
              <h4 className="text-body-md font-semibold text-primary">{editingId ? 'Edit Insurer' : 'Add Insurer to Panel'}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Insurance Company</label>
                <Select
                  value={formValue('insuranceCompanyId')}
                  onChange={(v) => setForm({ ...form, insuranceCompanyId: v })}
                  options={[
                    { value: '', label: 'Select insurer' },
                    ...insurers.map((ic) => ({ value: (getId(ic, 'id') ?? '').toString(), label: getString(ic, 'name') ?? '' })),
                  ]}
                  placeholder="Select insurer"
                  disabled={!!editingId}
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Participation %</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={formValue('participationPercent')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, participationPercent: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Insurer Claim #</label>
                <input
                  type="text"
                  value={formValue('insurerClaimNumber')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, insurerClaimNumber: e.target.value })}
                  placeholder="Claim reference"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Proposed Settlement</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formValue('proposedSettlement')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, proposedSettlement: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Agreed Settlement</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formValue('agreedSettlement')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, agreedSettlement: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Paid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={formValue('paidAmount')}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, paidAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Offer Status</label>
                <Select
                  value={formValue('offerStatus')}
                  onChange={(v) => setForm({ ...form, offerStatus: v })}
                  options={[
                    { value: '', label: 'None' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'ACCEPTED', label: 'Accepted' },
                    { value: 'REJECTED', label: 'Rejected' },
                    { value: 'COUNTERED', label: 'Countered' },
                  ]}
                  placeholder="None"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Payment Status</label>
                <Select
                  value={formValue('paymentStatus')}
                  onChange={(v) => setForm({ ...form, paymentStatus: v })}
                  options={[
                    { value: '', label: 'None' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'PARTIAL', label: 'Partial' },
                    { value: 'PAID', label: 'Paid' },
                  ]}
                  placeholder="None"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Lead Insurer</label>
                <label className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    checked={!!getBoolean(form, 'isLead')}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, isLead: e.target.checked })}
                    className="w-5 h-5 rounded border-outline text-primary focus:ring-primary/30"
                  />
                  <span className="text-body-md text-on-surface-variant">Set as lead insurer</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <input
                type="text"
                value={formValue('notes')}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !formValue('insuranceCompanyId')}
                className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                {saving ? 'Saving...' : editingId ? 'Update Insurer' : 'Add to Panel'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="h-10 px-4 border border-outline text-on-surface-variant rounded-lg font-semibold hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="p-4">
          {panel.length === 0 ? (
            <div className="text-center py-8">
              <Building2 size={32} className="text-outline mx-auto mb-2" />
              <p className="text-body-md text-on-surface-variant">No insurers on the panel.</p>
              {isAdmin ? (
                <p className="text-body-sm text-outline mt-1">Click &quot;Add Insurer&quot; to add one.</p>
              ) : (
                <p className="text-body-sm text-outline mt-1">Contact an Admin to add insurers.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {panel.map((ci) => {
                const ciId = getId(ci, 'id') ?? '';
                const insuranceCompany = getRecord(ci, 'insuranceCompany');
                const isLead = !!getBoolean(ci, 'isLead');
                return (
                  <div key={String(ciId)} className="bg-surface-container-low border border-surface-border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-surface-border">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isLead ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          <Building2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-body-md font-semibold text-on-surface truncate">{getString(insuranceCompany, 'name')}</p>
                            {isLead && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-medium bg-primary/10 text-primary shrink-0">
                                <CheckCircle size={10} />
                                Lead
                              </span>
                            )}
                          </div>
                          <p className="text-label-sm text-outline font-mono mt-0.5">
                            {getString(insuranceCompany, 'code') && `Code: ${getString(insuranceCompany, 'code')}`}
                            {getString(ci, 'insurerClaimNumber') && ` · Claim #: ${getString(ci, 'insurerClaimNumber')}`}
                            {getString(ci, 'participationPercent') && ` · ${getString(ci, 'participationPercent')}%`}
                          </p>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(ci)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            title="Edit"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleLead(ci)}
                            disabled={saving}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded transition-colors disabled:opacity-50 ${
                              isLead ? 'text-primary hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                            title={isLead ? 'Remove lead' : 'Set as lead'}
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleRemove(ci)}
                            disabled={saving}
                            className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors disabled:opacity-50"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-body-sm">
                      <div>
                        <p className="text-label-md text-outline uppercase">Proposed</p>
                        <p className="font-mono text-on-surface mt-0.5">
                          {getNumber(ci, 'proposedSettlement') ? formatCurrency(getNumber(ci, 'proposedSettlement') as string | number | undefined) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-label-md text-outline uppercase">Agreed</p>
                        <p className="font-mono text-on-surface mt-0.5">
                          {getNumber(ci, 'agreedSettlement') ? formatCurrency(getNumber(ci, 'agreedSettlement') as string | number | undefined) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-label-md text-outline uppercase">Paid</p>
                        <p className="font-mono text-on-surface mt-0.5">
                          {getNumber(ci, 'paidAmount') ? formatCurrency(getNumber(ci, 'paidAmount') as string | number | undefined) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-label-md text-outline uppercase">Balance</p>
                        <p className="font-mono text-on-surface mt-0.5">
                          {getNumber(ci, 'agreedSettlement') && getNumber(ci, 'paidAmount')
                            ? formatCurrency(Number(getNumber(ci, 'agreedSettlement')) - Number(getNumber(ci, 'paidAmount')))
                            : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="px-3 pb-3 flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-label-md text-outline uppercase">Offer:</span>
                        <StatusBadge status={getString(ci, 'offerStatus')} colors={OFFER_STATUS_COLORS_INSURER} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-label-md text-outline uppercase">Payment:</span>
                        <StatusBadge status={getString(ci, 'paymentStatus')} colors={PAYMENT_STATUS_COLORS_INSURER} />
                      </div>
                      {getString(ci, 'notes') && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-label-md text-outline uppercase shrink-0">Notes:</span>
                          <span className="text-body-sm text-on-surface-variant truncate">{getString(ci, 'notes')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

