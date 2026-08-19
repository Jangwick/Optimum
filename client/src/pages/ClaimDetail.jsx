import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClaim, updateClaimStatus, addClaimInsurer, updateClaimInsurer, removeClaimInsurer } from '../services/claim.service.js';
import { getClaimStatuses } from '../services/master-data.service.js';
import { getProcessStatuses, updateProcessStatus, getClosingGuards } from '../services/import.service.js';
import { getDocuments, uploadDocument, markDocumentReceived, deleteDocument, downloadDocument } from '../services/document.service.js';
import { getAssessments, createAssessment, deleteAssessment } from '../services/assessment.service.js';
import { getSettlement, saveSettlement, getOffers, createOffer, respondToOffer } from '../services/settlement.service.js';
import { getReports, createReport, generateReport, askClarification } from '../services/report.service.js';
import { getTasks, createTask, updateTask } from '../services/task.service.js';
import { getUsers } from '../services/user.service.js';
import { getDocumentCategories, getInsuranceCompanies } from '../services/master-data.service.js';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClaimInvestigation from '../components/ClaimInvestigation.jsx';
import ClaimFinance from '../components/ClaimFinance.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { setBreadcrumbLabel } from '../components/Breadcrumbs.jsx';
import { Lock, Ban, AlertTriangle, FileText, GitBranch, Search, FolderOpen, ClipboardCheck, Handshake, Wallet, FileBarChart, Building2, Clock, ListTodo, ArrowLeft, Plus, Trash2, CheckCircle, Download, FileCheck, File } from 'lucide-react';

export default function ClaimDetail() {
  const { id } = useParams();
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <ClaimDetailContent claimId={id} />
        </main>
      </div>
    </div>
  );
}

export function ClaimDetailContent({ claimId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [processStatuses, setProcessStatuses] = useState([]);
  const [closingGuards, setClosingGuards] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProcessStatus, setSelectedProcessStatus] = useState('');
  const [processNote, setProcessNote] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [claimData, statusesData, processData] = await Promise.all([
      getClaim(claimId),
      getClaimStatuses(),
      getProcessStatuses(),
    ]);
    setClaim(claimData.item);
    setStatuses(statusesData.items);
    setProcessStatuses(processData.items || []);
    setSelectedStatus(claimData.item.status?.code || '');
    setSelectedProcessStatus(claimData.item.processStatus?.code || '');
    setBreadcrumbLabel(claimData.item.claimNumber || 'Claim Details');
    setLoading(false);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [load, refresh]);

  // Load closing guards when process status approaches CLAIM_CLOSED or CLAIM_SETTLED
  useEffect(() => {
    if (
      selectedProcessStatus === 'CLAIM_CLOSED' ||
      selectedProcessStatus === 'CLAIM_SETTLED' ||
      claim?.processStatus?.code === 'ADJUSTMENT_COMPLETED'
    ) {
      getClosingGuards(claimId).then((res) => setClosingGuards(res.item)).catch(() => {});
    }
  }, [claimId, claim?.processStatus?.code, selectedProcessStatus]);

  const handleTransition = async (e) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === claim.status?.code) return;
    await updateClaimStatus(claimId, { statusCode: selectedStatus, notes: statusNote });
    setStatusNote('');
    setRefresh((r) => r + 1);
  };

  const handleProcessTransition = async (e) => {
    e.preventDefault();
    if (!selectedProcessStatus || selectedProcessStatus === claim.processStatus?.code) return;
    const payload = { statusCode: selectedProcessStatus, notes: processNote };
    if ((selectedProcessStatus === 'CLAIM_CLOSED' || selectedProcessStatus === 'CLAIM_SETTLED') && overrideReason) {
      payload.isOverride = true;
      payload.overrideReason = overrideReason;
    }
    // Read-only records always require override
    if (claim.isReadOnly && overrideReason) {
      payload.isOverride = true;
      payload.overrideReason = overrideReason;
    }
    try {
      await updateProcessStatus(claimId, payload);
      setProcessNote('');
      setOverrideReason('');
      setRefresh((r) => r + 1);
    } catch (err) {
      const msg = err.response?.data?.error || 'Transition failed';
      alert(msg);
    }
  };

  const tabs = [
    { key: 'summary', label: 'Summary', icon: FileText },
    { key: 'process', label: 'Process Status', icon: GitBranch },
    { key: 'investigation', label: 'Investigation', icon: Search },
    { key: 'documents', label: 'Documents', icon: FolderOpen },
    { key: 'assessment', label: 'Assessment', icon: ClipboardCheck },
    { key: 'settlement', label: 'Settlement', icon: Handshake },
    { key: 'finance', label: 'Finance', icon: Wallet },
    { key: 'reports', label: 'Reports', icon: FileBarChart },
    { key: 'insurers', label: 'Insurer Panel', icon: Building2 },
    { key: 'timeline', label: 'Timeline', icon: Clock },
    { key: 'tasks', label: 'Tasks', icon: ListTodo },
  ];

  if (loading || !claim) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-body-md text-on-surface-variant">Loading claim details...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/claims')}
        className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant hover:text-primary transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Claims
      </button>

      {/* Header card */}
      <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={20} className="text-primary shrink-0" />
              <h2 className="text-headline-lg font-semibold text-primary font-mono">{claim.claimNumber}</h2>
            </div>
            <p className="text-body-md text-on-surface-variant">
              {claim.claimType?.name || '—'} · {claim.client?.name || '—'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {claim.processStatus && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md font-medium"
                style={{ backgroundColor: `${claim.processStatus.color}1a`, color: claim.processStatus.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: claim.processStatus.color }} />
                {claim.processStatus.name}
              </span>
            )}
            {claim.importStatus && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium bg-surface-container-high text-on-surface-variant"
                title="Historical OCS import status"
              >
                OCS: {claim.importStatus.name}
              </span>
            )}
            {claim.status && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-medium opacity-60"
                style={{ backgroundColor: `${claim.status.color}1a`, color: claim.status.color }}
                title="Secondary internal status (read-only / action-driven)"
              >
                Internal: {claim.status.code}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Read-only alert */}
      {claim.isReadOnly && (
        <div
          className={`mb-6 rounded-lg border p-4 flex items-start gap-3 ${
            claim.isCancelled
              ? 'bg-error/5 border-error/30 text-error'
              : 'bg-accent-orange/5 border-accent-orange/30 text-accent-orange'
          }`}
        >
          {claim.isCancelled ? <Ban size={20} className="mt-0.5 shrink-0" /> : <Lock size={20} className="mt-0.5 shrink-0" />}
          <div>
            <p className="font-semibold text-body-md">
              {claim.isCancelled ? 'Cancelled Historical Record' : 'Closed Historical Record'}
            </p>
            <p className="text-body-sm mt-0.5 text-on-surface-variant">
              {claim.isCancelled
                ? `This claim was cancelled during migration and is read-only. Reason: ${claim.cancellationReason || 'Not specified'}`
                : 'This claim was imported from a closed workbook sheet and is read-only. Use Admin override with a reason to make changes.'}
            </p>
          </div>
        </div>
      )}

      {/* Incomplete record alert */}
      {claim.isIncomplete && !claim.isReadOnly && (
        <div className="mb-6 bg-accent-orange/5 border border-accent-orange/30 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-accent-orange" />
          <div>
            <p className="font-semibold text-body-md text-accent-orange">Incomplete Record</p>
            {claim.incompleteReasons?.length > 0 && (
              <ul className="text-body-sm list-disc list-inside mt-1 text-on-surface-variant">
                {claim.incompleteReasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Tabs with icons */}
      <div className="flex gap-1 border-b border-surface-border mb-6 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-body-md font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                <t.icon size={16} className={activeTab === t.key ? 'text-primary' : 'text-outline'} />
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'summary' && <SummaryTab claim={claim} statuses={statuses} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} statusNote={statusNote} setStatusNote={setStatusNote} onTransition={handleTransition} />}
          {activeTab === 'process' && <ProcessStatusTab claim={claim} processStatuses={processStatuses} selectedProcessStatus={selectedProcessStatus} setSelectedProcessStatus={setSelectedProcessStatus} processNote={processNote} setProcessNote={setProcessNote} overrideReason={overrideReason} setOverrideReason={setOverrideReason} onTransition={handleProcessTransition} closingGuards={closingGuards} isAdmin={user?.role === 'ADMIN'} />}
          {activeTab === 'investigation' && <ClaimInvestigation claimId={claimId} />}
          {activeTab === 'documents' && <DocumentsTab claimId={claimId} />}
          {activeTab === 'assessment' && <AssessmentTab claimId={claimId} />}
          {activeTab === 'settlement' && <SettlementTab claimId={claimId} />}
          {activeTab === 'finance' && <ClaimFinance claimId={claimId} />}
          {activeTab === 'reports' && <ReportsTab claimId={claimId} />}
          {activeTab === 'insurers' && <InsurerPanelTab claim={claim} claimId={claimId} isAdmin={user?.role === 'ADMIN'} />}
          {activeTab === 'timeline' && <TimelineTab claim={claim} />}
          {activeTab === 'tasks' && <TasksTab claimId={claimId} />}
    </div>
  );
}

function SummaryTab({ claim, statuses, selectedStatus, setSelectedStatus, statusNote, setStatusNote, onTransition }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Claim Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-body-md">
            <Info label="OCS Ref #" value={claim.claimNumber} mono />
            <Info label="Assignment #" value={claim.assignmentNumber} mono />
            <Info label="Insurer Claim #" value={claim.insurerClaimNumber} mono />
            <Info label="Handling Adjuster" value={claim.handlingAdjuster || claim.engineer?.fullName} />
            <Info label="Insured" value={claim.client?.name} />
            <Info label="Insurer" value={claim.insuranceCompany?.name} />
            <Info label="Broker" value={claim.broker?.name} />
            <Info label="Broker Ref" value={claim.brokerReference} mono />
            <Info label="Policy No." value={claim.policy?.policyNumber || claim.policyNumber} mono />
            <Info label="Policy Type" value={claim.policyType} />
            <Info label="Policy Period" value={claim.policyPeriodText} />
            <Info label="Date of Loss" value={claim.dateOfLoss ? new Date(claim.dateOfLoss).toLocaleDateString() : '—'} />
            <Info label="Nature of Loss" value={claim.natureOfLoss} />
            <Info label="Location" value={claim.locationOfLoss} />
            <Info label="Received" value={new Date(claim.dateReceived).toLocaleDateString()} />
            <Info label="Date Inspected" value={claim.dateInspected ? new Date(claim.dateInspected).toLocaleDateString() : '—'} />
            <Info label="Letter Request" value={claim.letterRequestDate ? new Date(claim.letterRequestDate).toLocaleDateString() : '—'} />
            <Info label="Denial Letter" value={claim.denialLetterDate ? new Date(claim.denialLetterDate).toLocaleDateString() : '—'} />
          </div>
          {claim.policyCoverageText && (
            <div className="mt-4 pt-4 border-t border-surface-border">
              <span className="text-label-md text-outline uppercase">Policy Coverage / Sum Insured</span>
              <p className="text-body-md mt-1">{claim.policyCoverageText}</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-surface-border">
            <span className="text-label-md text-outline uppercase">Description</span>
            <p className="text-body-md mt-1">{claim.description || '—'}</p>
          </div>
        </section>

        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Financial Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-body-md">
            <Info label="Estimated Loss" value={formatCurrency(claim.estimatedLoss)} money />
            <Info label="Reserve" value={formatCurrency(claim.reserve)} money />
            <Info label="Claimed Amount" value={claim.claimedAmountRaw || formatCurrency(claim.claimedAmount)} money />
            <Info label="Proposed Settlement" value={claim.proposedSettlementRaw || formatCurrency(claim.proposedSettlement)} money />
            <Info label="Agreed Settlement" value={claim.agreedSettlementRaw || formatCurrency(claim.agreedSettlement)} money />
          </div>
        </section>

        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Assignment</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-body-md">
            <Info label="Engineer" value={claim.engineer?.fullName} />
            <Info label="Accountant" value={claim.accountant?.fullName} />
            <Info label="Assigned By" value={claim.assignedByName} />
            <Info label="Contact" value={claim.contactRaw} />
          </div>
        </section>

        {claim.importStatus && (
          <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Historical Import Metadata</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-body-md">
              <Info label="OCS Import Status" value={claim.importStatus.name} />
              <Info label="Import Batch" value={claim.importBatchId} mono />
              <Info label="Imported At" value={claim.importedAt ? new Date(claim.importedAt).toLocaleString() : '—'} />
              <Info label="Cancelled" value={claim.isCancelled ? 'Yes' : 'No'} />
              {claim.isCancelled && <Info label="Cancellation Reason" value={claim.cancellationReason} />}
            </div>
            {claim.remarksRaw && (
              <div className="mt-4 pt-4 border-t border-surface-border">
                <span className="text-label-md text-outline uppercase">Original Remarks</span>
                <p className="text-body-md mt-1 whitespace-pre-wrap">{claim.remarksRaw}</p>
              </div>
            )}
            {claim.latestStatusRaw && (
              <div className="mt-4 pt-4 border-t border-surface-border">
                <span className="text-label-md text-outline uppercase">Original Latest Status</span>
                <p className="text-body-md mt-1 whitespace-pre-wrap">{claim.latestStatusRaw}</p>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="space-y-6">
        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Update Status</h3>
          </div>
          <form onSubmit={onTransition} className="space-y-4">
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
                placeholder="Add transition notes..."
                className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
              />
            </div>
            <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors inline-flex items-center justify-center gap-2">
              <GitBranch size={16} />
              Update Status
            </button>
          </form>
        </section>

        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Status History</h3>
          </div>
          {claim.history?.length ? (
            <ul className="space-y-4 text-body-sm">
              {claim.history.map((h) => (
                <li key={h.id} className="relative pl-6 pb-4 last:pb-0">
                  <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
                  <span className="absolute left-[3.5px] top-4 bottom-0 w-px bg-surface-border" />
                  <p className="font-medium text-on-surface">{h.status?.code || '—'}</p>
                  <p className="text-on-surface-variant mt-0.5">{h.notes || 'No notes'}</p>
                  <p className="text-label-sm text-outline mt-1 font-mono">
                    {h.changedBy} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-on-surface-variant text-body-sm">No history yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function Info({ label, value, money, mono }) {
  return (
    <div className="min-w-0">
      <span className="text-label-md text-outline uppercase tracking-wide">{label}</span>
      <p className={`mt-1 text-on-surface break-words ${money || mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function DocumentsTab({ claimId }) {
  const [checklist, setChecklist] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [desc, setDesc] = useState('');
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docData, catData] = await Promise.all([getDocuments(claimId), getDocumentCategories()]);
      setChecklist(docData.items || []);
      setCategories(catData.items || []);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleUpload = async (e) => {
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
    } catch {
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleMark = (docId) => async () => {
    try {
      await markDocumentReceived(claimId, docId);
      await load();
    } catch {
      setError('Failed to mark document as received');
    }
  };

  const handleDelete = (docId) => async () => {
    if (!confirm('Delete this document? The file will be permanently removed.')) return;
    try {
      await deleteDocument(claimId, docId);
      await load();
    } catch {
      setError('Failed to delete document');
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const response = await downloadDocument(claimId, docId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download document');
    }
  };

  const totalDocs = checklist.reduce((sum, g) => sum + (g.uploaded?.length || 0), 0);
  const receivedDocs = checklist.reduce(
    (sum, g) => sum + (g.uploaded?.filter((d) => d.isReceived).length || 0),
    0
  );

  function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function fileIcon(mimeType) {
    if (mimeType?.startsWith('image/')) return <File size={16} className="text-primary" />;
    if (mimeType?.includes('pdf')) return <FileText size={16} className="text-error" />;
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

      {/* Summary cards */}
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

      {/* Upload form */}
      <form onSubmit={handleUpload} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <FolderOpen size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">Upload Document</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">File</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-body-md file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white file:font-medium file:cursor-pointer hover:file:bg-primary-container transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Description</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
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

      {/* Document checklist */}
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
          const docs = group.uploaded || [];
          const receivedCount = docs.filter((d) => d.isReceived).length;
          return (
            <div key={group.category?.id || 'unknown'} className="bg-surface border border-surface-border rounded-lg shadow-sm overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderOpen size={16} className="text-primary shrink-0" />
                  <h4 className="text-body-md font-semibold text-primary truncate">{group.category?.name || 'Uncategorized'}</h4>
                  {group.isRequired && (
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

              {/* Documents list */}
              <div className="p-3">
                {docs.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant py-2">No documents uploaded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {docs.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-surface-border">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                            {fileIcon(doc.mimeType)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-body-sm font-medium text-on-surface truncate">{doc.originalName}</p>
                              {doc.isReceived && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label-sm font-medium bg-success/10 text-success shrink-0">
                                  <CheckCircle size={10} />
                                  Received
                                </span>
                              )}
                            </div>
                            <p className="text-label-sm text-outline mt-0.5">
                              {doc.description || 'No description'}
                              {' · '}
                              <span className="font-mono">{formatFileSize(doc.size)}</span>
                              {' · '}
                              {new Date(doc.createdAt).toLocaleDateString()}
                              {doc.uploadedBy && ` · ${doc.uploadedBy}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDownload(doc.id, doc.originalName)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          {!doc.isReceived && (
                            <button
                              onClick={handleMark(doc.id)}
                              className="inline-flex items-center justify-center w-8 h-8 rounded text-success hover:bg-success/10 transition-colors"
                              title="Mark received"
                            >
                              <FileCheck size={16} />
                            </button>
                          )}
                          <button
                            onClick={handleDelete(doc.id)}
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

function AssessmentTab({ claimId }) {
  const [assessments, setAssessments] = useState([]);
  const [items, setItems] = useState([{ description: '', quantity: 1, unitCost: 0 }]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { items } = await getAssessments(claimId);
      setAssessments(items || []);
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

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx][field] = field === 'description' ? value : Number(value);
    setItems(next);
  };

  const total = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitCost || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAssessment(claimId, { notes, items });
      setNotes('');
      setItems([{ description: '', quantity: 1, unitCost: 0 }]);
      await load();
    } catch {
      setError('Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this assessment and all its line items?')) return;
    try {
      await deleteAssessment(claimId, id);
      await load();
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

        {/* Line items */}
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
                value={it.description}
                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                placeholder="Item description"
                className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                required
              />
              <input
                type="number"
                value={it.quantity}
                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                placeholder="0"
                min="1"
                className="h-10 px-3 rounded border border-outline bg-surface text-body-md text-center font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                required
              />
              <input
                type="number"
                step="0.01"
                value={it.unitCost}
                onChange={(e) => updateItem(idx, 'unitCost', e.target.value)}
                placeholder="0.00"
                min="0"
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
            onChange={(e) => setNotes(e.target.value)}
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

      {/* Assessment list */}
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
          <div key={a.id} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-surface-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ClipboardCheck size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-body-md font-semibold text-on-surface">Assessment #{a.id}</p>
                  <p className="text-label-sm text-outline font-mono mt-0.5">
                    {new Date(a.assessmentDate).toLocaleString()}
                    {a.preparedBy && ' · ' + a.preparedBy.firstName + ' ' + a.preparedBy.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="font-mono text-headline-sm font-semibold text-primary">{formatCurrency(a.totalAmount)}</p>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded text-error hover:bg-error/10 transition-colors"
                  title="Delete assessment"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {a.notes && (
                <div>
                  <span className="text-label-md text-outline uppercase">Notes</span>
                  <p className="text-body-sm text-on-surface mt-0.5">{a.notes}</p>
                </div>
              )}
              <div>
                <span className="text-label-md text-outline uppercase">Line Items</span>
                <ul className="mt-1 divide-y divide-surface-border text-body-sm">
                  {a.items.map((it) => (
                    <li key={it.id} className="py-2 flex justify-between items-center gap-3">
                      <span className="text-on-surface truncate">{it.description}</span>
                      <span className="text-on-surface-variant font-mono text-body-sm whitespace-nowrap">
                        {it.quantity} × {formatCurrency(it.unitCost)}
                      </span>
                      <span className="font-mono text-on-surface font-medium min-w-[100px] text-right whitespace-nowrap">
                        {formatCurrency(it.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              {a.depreciation > 0 && (
                <div className="flex justify-between items-center pt-2 border-t border-surface-border">
                  <span className="text-label-md text-outline uppercase">Depreciation</span>
                  <span className="font-mono text-body-sm text-on-surface-variant">-{formatCurrency(a.depreciation)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-surface-border">
                <span className="text-label-md text-outline uppercase font-medium">Total</span>
                <span className="font-mono text-headline-sm font-semibold text-primary">{formatCurrency(a.totalAmount)}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SettlementTab({ claimId }) {
  const [offers, setOffers] = useState([]);
  const [settlement, setSettlement] = useState(null);
  const [form, setForm] = useState({ settledAmount: '', settlementDate: '', status: 'PENDING', notes: '' });
  const [offerForm, setOfferForm] = useState({ offeredAmount: '', notes: '' });
  const [response, setResponse] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, o] = await Promise.all([getSettlement(claimId), getOffers(claimId)]);
      if (s.item) {
        setSettlement(s.item);
        setForm({
          settledAmount: s.item.settledAmount?.toString() || '',
          settlementDate: s.item.settlementDate?.slice(0, 10) || '',
          status: s.item.status || 'PENDING',
          notes: s.item.notes || '',
        });
      } else {
        setSettlement(null);
      }
      setOffers(o.items || []);
    } catch {
      setError('Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveSettlement(claimId, form);
      await load();
    } catch {
      setError('Failed to save settlement');
    } finally {
      setSaving(false);
    }
  };

  const handleOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.offeredAmount) return;
    setSaving(true);
    setError(null);
    try {
      await createOffer(claimId, offerForm);
      setOfferForm({ offeredAmount: '', notes: '' });
      await load();
    } catch {
      setError('Failed to create offer');
    } finally {
      setSaving(false);
    }
  };

  const handleResponse = async (offerId) => {
    const r = response[offerId];
    if (!r?.status) return;
    setSaving(true);
    setError(null);
    try {
      await respondToOffer(claimId, offerId, r);
      setResponse({ ...response, [offerId]: {} });
      await load();
    } catch {
      setError('Failed to respond to offer');
    } finally {
      setSaving(false);
    }
  };

  const SETTLEMENT_STATUS_COLORS = {
    PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
    AGREED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
    REJECTED: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
  };

  const OFFER_STATUS_COLORS = {
    PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
    ACCEPTED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
    REJECTED: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
    COUNTERED: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
  };

  function StatusPill({ status, colors }) {
    const c = colors[status] || { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
        {status}
      </span>
    );
  }

  const acceptedOffer = offers.find((o) => o.status === 'ACCEPTED');

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error/10 border border-error/30 text-error rounded-lg p-3 text-body-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Handshake size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Settled</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono">{formatCurrency(settlement?.settledAmount || 0)}</p>
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
            <p className="text-headline-sm font-semibold text-on-surface font-mono">{formatCurrency(acceptedOffer?.offeredAmount || 0)}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Status</p>
            <p className="text-headline-sm font-semibold text-on-surface">{settlement?.status || 'PENDING'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Settlement form + New Offer form */}
        <div className="space-y-6">
          {/* Settlement form */}
          <section className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-4 bg-surface-container-low border-b border-surface-border">
              <Handshake size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Settlement</h3>
              {settlement && <StatusPill status={settlement.status} colors={SETTLEMENT_STATUS_COLORS} />}
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-md text-outline uppercase mb-1.5">Settlement Date</label>
                  <input
                    type="date"
                    value={form.settlementDate}
                    onChange={(e) => setForm({ ...form, settlementDate: e.target.value })}
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
                    onChange={(e) => setForm({ ...form, settledAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                >
                  <option value="PENDING">Pending</option>
                  <option value="AGREED">Agreed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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

          {/* New Offer form */}
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
                  value={offerForm.offeredAmount}
                  onChange={(e) => setOfferForm({ ...offerForm, offeredAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
                <textarea
                  value={offerForm.notes}
                  onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })}
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

        {/* Right column: Offers list */}
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
              offers.map((o) => (
                <div key={o.id} className="bg-surface-container-low border border-surface-border rounded-lg overflow-hidden">
                  {/* Offer header */}
                  <div className="flex items-center justify-between p-3 border-b border-surface-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0">
                        <Handshake size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-body-md font-semibold text-on-surface">{formatCurrency(o.offeredAmount)}</p>
                        <p className="text-label-sm text-outline font-mono mt-0.5">
                          {new Date(o.createdAt || o.offerDate).toLocaleDateString()}
                          {o.createdBy && ' \u00b7 ' + o.createdBy.firstName + ' ' + o.createdBy.lastName}
                        </p>
                      </div>
                    </div>
                    <StatusPill status={o.status} colors={OFFER_STATUS_COLORS} />
                  </div>

                  {/* Offer body */}
                  <div className="p-3 space-y-2">
                    {o.notes && (
                      <div>
                        <span className="text-label-md text-outline uppercase">Notes</span>
                        <p className="text-body-sm text-on-surface mt-0.5">{o.notes}</p>
                      </div>
                    )}

                    {/* Response info */}
                    {o.status !== 'PENDING' && (
                      <div className="pt-2 border-t border-surface-border">
                        <span className="text-label-md text-outline uppercase">Response</span>
                        <p className="text-body-sm text-on-surface mt-0.5">
                          {o.responseDate && <span className="font-mono">{new Date(o.responseDate).toLocaleDateString()}</span>}
                          {o.responseBy && ' \u00b7 ' + o.responseBy.firstName + ' ' + o.responseBy.lastName}
                        </p>
                      </div>
                    )}

                    {/* Response form (only for pending offers) */}
                    {o.status === 'PENDING' && (
                      <div className="pt-2 border-t border-surface-border space-y-2">
                        <span className="text-label-md text-outline uppercase font-medium">Respond to Offer</span>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={response[o.id]?.status || ''}
                            onChange={(e) => setResponse({ ...response, [o.id]: { ...response[o.id], status: e.target.value } })}
                            className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                          >
                            <option value="">Select response</option>
                            <option value="ACCEPTED">Accept</option>
                            <option value="REJECTED">Reject</option>
                            <option value="COUNTERED">Counter</option>
                          </select>
                          <input
                            type="text"
                            value={response[o.id]?.notes || ''}
                            onChange={(e) => setResponse({ ...response, [o.id]: { ...response[o.id], notes: e.target.value } })}
                            placeholder="Response notes"
                            className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => handleResponse(o.id)}
                          disabled={saving || !response[o.id]?.status}
                          className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={16} />
                          Submit Response
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportsTab({ claimId }) {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [reportTemplateId, setReportTemplateId] = useState('');
  const [clarification, setClarification] = useState({});

  const load = useCallback(async () => {
    const [{ items }, { data: tData }] = await Promise.all([getReports(claimId), api.get('/report-templates')]);
    setReports(items || []);
    setTemplates(tData.items || []);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { title, notes };
    if (reportTemplateId) payload.reportTemplateId = reportTemplateId;
    await createReport(claimId, payload);
    setTitle('');
    setNotes('');
    setReportTemplateId('');
    await load();
  };

  const handleGenerate = async (reportId) => {
    await generateReport(claimId, reportId);
    await load();
  };

  const handleClarify = async (reportId) => {
    await askClarification(claimId, reportId, { question: clarification[reportId] });
    setClarification({ ...clarification, [reportId]: '' });
    await load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <FileBarChart size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">New Report Draft</h3>
        </div>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Report title" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
        <select value={reportTemplateId} onChange={(e) => setReportTemplateId(e.target.value)} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md">
          <option value="">Default HTML template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.type})
            </option>
          ))}
        </select>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes / summary" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
        <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Create Draft</button>
      </form>

      {reports.map((r) => (
        <div key={r.id} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-body-lg font-semibold text-primary">{r.title}</p>
              <p className="text-body-md">Status: {r.status}</p>
            </div>
            <div className="flex gap-2">
              {r.pdfPath && (
                <a href={`/api/claims/${claimId}/reports/${r.id}/download`} target="_blank" rel="noreferrer" className="h-10 px-4 bg-primary text-white rounded font-semibold flex items-center">
                  Download PDF
                </a>
              )}
              {r.docxPath && (
                <a href={`/api/claims/${claimId}/reports/${r.id}/download/docx`} target="_blank" rel="noreferrer" className="h-10 px-4 bg-secondary text-white rounded font-semibold flex items-center">
                  Download DOCX
                </a>
              )}
              <button onClick={() => handleGenerate(r.id)} className="h-10 px-4 bg-primary text-white rounded font-semibold">Generate</button>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={clarification[r.id] || ''}
              onChange={(e) => setClarification({ ...clarification, [r.id]: e.target.value })}
              placeholder="Ask a clarification"
              className="flex-1 h-10 px-3 rounded border border-outline bg-surface text-body-md"
            />
            <button onClick={() => handleClarify(r.id)} className="h-10 px-4 bg-secondary text-white rounded font-semibold">Ask</button>
          </div>
          <ul className="mt-3 space-y-2 text-body-sm">
            {r.versions?.map((v) => (
              <li key={v.id} className="p-2 bg-surface-container-low rounded">
                Version {v.versionNumber} · {new Date(v.generatedAt).toLocaleString()}
              </li>
            )) || <li className="text-on-surface-variant">No versions.</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TasksTab({ claimId }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', assignedToId: '', dueDate: '' });

  const load = useCallback(async () => {
    const [t, u] = await Promise.all([
      getTasks({ claimId }),
      getUsers().catch(() => ({ users: [] })),
    ]);
    setTasks(t.items || []);
    setUsers(u.users || []);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createTask({ ...form, claimId });
    setForm({ title: '', description: '', assignedToId: '', dueDate: '' });
    await load();
  };

  const handleStatus = async (id, status) => {
    await updateTask(id, { status });
    await load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ListTodo size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">New Task</h3>
        </div>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" required />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
        <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" required disabled={users.length === 0}>
          <option value="">{users.length === 0 ? 'No users available' : 'Assign to'}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName} ({u.role})
            </option>
          ))}
        </select>
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
        <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Create Task</button>
      </form>

      <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="p-3 bg-surface-container-low rounded flex justify-between items-center">
            <div>
              <p className="text-body-md font-semibold">{t.title}</p>
              <p className="text-body-sm text-on-surface-variant">{t.description}</p>
              <p className="text-label-sm text-outline">Assigned to {t.assignedTo?.firstName} {t.assignedTo?.lastName} · {t.status}</p>
            </div>
            <div className="flex gap-2">
              {t.status !== 'COMPLETED' && (
                <button onClick={() => handleStatus(t.id, 'COMPLETED')} className="h-8 px-3 bg-success text-white text-label-md rounded">
                  Complete
                </button>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-body-md text-on-surface-variant">No tasks yet.</p>}
      </div>
    </div>
  );
}

function ProcessStatusTab({ claim, processStatuses, selectedProcessStatus, setSelectedProcessStatus, processNote, setProcessNote, overrideReason, setOverrideReason, onTransition, closingGuards, isAdmin }) {
  const needsOverride =
    claim.isReadOnly ||
    selectedProcessStatus === 'CLAIM_CLOSED' ||
    selectedProcessStatus === 'CLAIM_SETTLED';
  const guardsNotMet = needsOverride && closingGuards && !closingGuards.canClose;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">18-Stage Workflow Status</h3>
          </div>
          <div className="mb-4">
            <p className="text-label-md text-outline uppercase mb-1.5">Current Process Status</p>
            {claim.processStatus && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md font-medium"
                style={{ backgroundColor: `${claim.processStatus.color}1a`, color: claim.processStatus.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: claim.processStatus.color }} />
                {claim.processStatus.name}
              </span>
            )}
          </div>

          {claim.isReadOnly && (
            <div className="mb-4 bg-accent-orange/5 border border-accent-orange/30 rounded-lg p-3 text-accent-orange text-body-sm flex items-start gap-2">
              <Lock size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">This is a read-only historical record.</p>
                <p className="mt-0.5 text-on-surface-variant">Any status change requires an Admin override with a reason.</p>
              </div>
            </div>
          )}

          {isAdmin && (
            <form onSubmit={onTransition} className="space-y-4">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">New Status</label>
                <select
                  value={selectedProcessStatus}
                  onChange={(e) => setSelectedProcessStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                >
                  {processStatuses.map((s) => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Notes</label>
                <textarea
                  value={processNote}
                  onChange={(e) => setProcessNote(e.target.value)}
                  rows={3}
                  placeholder="Add transition notes..."
                  className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                />
              </div>
              {guardsNotMet && (
                <div className="bg-error-container/10 border border-error/30 rounded p-4 space-y-3">
                  <p className="text-body-md font-medium text-error">Guards not met:</p>
                  <ul className="text-body-sm text-on-surface list-disc list-inside">
                    {closingGuards.reasons?.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              {needsOverride && (
                <div>
                  <label className="block text-label-md text-outline uppercase mb-1.5">
                    Override reason {claim.isReadOnly ? '(required for read-only records)' : '(Admin only)'}
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide a reason to override"
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
              )}
              <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors inline-flex items-center justify-center gap-2">
                <GitBranch size={16} />
                Update Process Status
              </button>
            </form>
          )}

          {!isAdmin && (
            <p className="text-body-md text-on-surface-variant">Only Admins can change process status.</p>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Process History</h3>
          </div>
          {claim.processHistory?.length ? (
            <ul className="space-y-4 text-body-sm">
              {claim.processHistory.map((h) => (
                <li key={h.id} className="relative pl-6 pb-4 last:pb-0">
                  <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
                  <span className="absolute left-[3.5px] top-4 bottom-0 w-px bg-surface-border" />
                  <p className="font-medium text-on-surface">{h.status?.name || h.status?.code}</p>
                  <p className="text-on-surface-variant mt-0.5">{h.notes || 'No notes'}</p>
                  {h.isOverride && <p className="text-label-sm text-error mt-1">Override: {h.overrideReason}</p>}
                  <p className="text-label-sm text-outline mt-1 font-mono">
                    {h.changedBy} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-on-surface-variant text-body-sm">No process history yet.</p>
          )}
        </section>

        {closingGuards && (
          <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Closing Guards</h3>
            </div>
            <p className={`text-body-md font-medium ${closingGuards.canClose ? 'text-success' : 'text-error'}`}>
              {closingGuards.canClose ? 'Ready to close' : 'Not ready to close'}
            </p>
            {closingGuards.reasons?.length > 0 && (
              <ul className="mt-2 text-body-sm text-on-surface-variant list-disc list-inside">
                {closingGuards.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function InsurerPanelTab({ claim: initialClaim, claimId, isAdmin }) {
  const [insurers, setInsurers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ insuranceCompanyId: '', isLead: false, participationPercent: '', insurerClaimNumber: '', notes: '' });
  const [refresh, setRefresh] = useState(0);
  const [claim, setClaim] = useState(initialClaim);

  useEffect(() => {
    if (isAdmin) {
      getInsuranceCompanies().then((res) => setInsurers(res.items || []));
    }
  }, [isAdmin]);

  // Reload claim data when refresh changes
  useEffect(() => {
    if (refresh > 0) {
      getClaim(claimId).then((res) => setClaim(res.item));
    }
  }, [refresh, claimId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.insuranceCompanyId) return;
    await addClaimInsurer(claimId, form);
    setForm({ insuranceCompanyId: '', isLead: false, participationPercent: '', insurerClaimNumber: '', notes: '' });
    setShowForm(false);
    setRefresh((r) => r + 1);
  };

  const handleToggleLead = async (ci) => {
    await updateClaimInsurer(claimId, ci.id, { isLead: !ci.isLead });
    setRefresh((r) => r + 1);
  };

  const handleRemove = async (ci) => {
    if (!confirm(`Remove ${ci.insuranceCompany?.name} from the panel?`)) return;
    await removeClaimInsurer(claimId, ci.id);
    setRefresh((r) => r + 1);
  };

  const currentPanel = claim.insurerPanel || [];

  return (
    <div className="space-y-6">
      <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Insurer Panel</h3>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded text-body-sm font-semibold hover:bg-primary-container transition-colors"
            >
              <Plus size={16} />
              Add Insurer
            </button>
          )}
        </div>

        {showForm && isAdmin && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-surface-container-low rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Insurance Company</label>
                <select
                  value={form.insuranceCompanyId}
                  onChange={(e) => setForm({ ...form, insuranceCompanyId: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  required
                >
                  <option value="">Select insurer</option>
                  {insurers.map((ic) => (
                    <option key={ic.id} value={ic.id}>{ic.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Participation %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.participationPercent}
                  onChange={(e) => setForm({ ...form, participationPercent: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Insurer Claim #</label>
                <input
                  type="text"
                  value={form.insurerClaimNumber}
                  onChange={(e) => setForm({ ...form, insurerClaimNumber: e.target.value })}
                  placeholder="Claim reference"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Lead Insurer</label>
                <label className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    checked={form.isLead}
                    onChange={(e) => setForm({ ...form, isLead: e.target.checked })}
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
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors">
                Add to Panel
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="h-10 px-4 border border-outline text-on-surface-variant rounded font-semibold hover:bg-surface-container-low transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {currentPanel.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No insurers on the panel.</p>
        ) : (
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-left text-on-surface-variant border-b border-surface-border">
                <th className="py-2 pr-4">Insurer</th>
                <th className="py-2 pr-4">Lead</th>
                <th className="py-2 pr-4">Participation</th>
                <th className="py-2 pr-4">Insurer Claim #</th>
                {isAdmin && <th className="py-2 pr-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {currentPanel.map((ci) => (
                <tr key={ci.id} className="border-b border-surface-border/50">
                  <td className="py-2 pr-4 text-on-surface font-medium">{ci.insuranceCompany?.name}</td>
                  <td className="py-2 pr-4">
                    {isAdmin ? (
                      <button
                        onClick={() => handleToggleLead(ci)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-md font-medium transition-colors ${
                          ci.isLead ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-primary'
                        }`}
                      >
                        {ci.isLead && <CheckCircle size={12} />}
                        {ci.isLead ? 'Yes' : 'No'}
                      </button>
                    ) : ci.isLead ? (
                      <span className="text-primary font-medium">Yes</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2 pr-4 text-on-surface-variant font-mono">{ci.participationPercent ? `${ci.participationPercent}%` : '—'}</td>
                  <td className="py-2 pr-4 text-on-surface-variant font-mono">{ci.insurerClaimNumber || '—'}</td>
                  {isAdmin && (
                    <td className="py-2 pr-4 text-right">
                      <button
                        onClick={() => handleRemove(ci)}
                        className="inline-flex items-center gap-1 text-error hover:text-error/80 text-label-md font-medium transition-colors"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isAdmin && currentPanel.length === 0 && (
          <p className="text-label-sm text-on-surface-variant mt-2">Contact an Admin to add insurers to this panel.</p>
        )}
      </section>
    </div>
  );
}

function TimelineTab({ claim }) {
  const activities = claim.activities || [];
  const correspondence = claim.correspondence || [];
  const allEvents = [
    ...activities.map((a) => ({ type: 'activity', date: a.occurredAt, title: a.activityType, desc: a.description, actor: a.actor, source: a.source })),
    ...correspondence.map((c) => ({ type: 'correspondence', date: c.sentAt, title: c.type, desc: c.notes, actor: null, source: null, followUp: c.followUpDate })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return (
    <div className="space-y-6">
      <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-primary" />
        <h3 className="text-headline-sm font-semibold text-primary">Activity Timeline</h3>
      </div>
        {allEvents.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No activities or correspondence recorded.</p>
        ) : (
          <ul className="space-y-4">
            {allEvents.map((evt, i) => (
              <li key={i} className="relative pl-6 pb-4 last:pb-0">
                <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20" />
                <span className="absolute left-[3.5px] top-4 bottom-0 w-px bg-surface-border" />
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-label-sm font-medium ${evt.type === 'activity' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {evt.type}
                  </span>
                  <p className="font-medium text-body-md text-on-surface">{evt.title}</p>
                </div>
                {evt.desc && <p className="text-body-sm text-on-surface-variant mt-1">{evt.desc}</p>}
                <p className="text-label-sm text-outline mt-1 font-mono">
                  {evt.date ? new Date(evt.date).toLocaleString() : 'No date'}
                  {evt.actor && ` · ${evt.actor}`}
                  {evt.source && ` · ${evt.source}`}
                  {evt.followUp && ` · Follow-up: ${new Date(evt.followUp).toLocaleDateString()}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
