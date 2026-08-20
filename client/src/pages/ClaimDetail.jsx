import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClaim, updateClaimStatus, addClaimInsurer, updateClaimInsurer, removeClaimInsurer } from '../services/claim.service.js';
import { getClaimStatuses } from '../services/master-data.service.js';
import { getDocuments, uploadDocument, markDocumentReceived, deleteDocument, downloadDocument } from '../services/document.service.js';
import { getAssessments, createAssessment, deleteAssessment } from '../services/assessment.service.js';
import { getSettlement, saveSettlement, getOffers, createOffer, respondToOffer } from '../services/settlement.service.js';
import { getReports, createReport, generateReport, askClarification, getDownloadUrl } from '../services/report.service.js';
import { getTasks, createTask, updateTask, deleteTask } from '../services/task.service.js';
import { getUsers } from '../services/user.service.js';
import { getDocumentCategories, getInsuranceCompanies } from '../services/master-data.service.js';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClaimInvestigation from '../components/ClaimInvestigation.jsx';
import ClaimFinance from '../components/ClaimFinance.jsx';
import { EditClaimModal } from '../components/EditClaimModal.jsx';
import { AssignClaimModal } from '../components/AssignClaimModal.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { setBreadcrumbLabel } from '../components/Breadcrumbs.jsx';
import { Lock, Ban, AlertTriangle, FileText, GitBranch, Search, FolderOpen, ClipboardCheck, Handshake, Wallet, FileBarChart, Building2, Clock, ListTodo, ArrowLeft, Plus, Trash2, CheckCircle, Download, FileCheck, File, UploadCloud, X, Pencil } from 'lucide-react';

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
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const onClaimChange = useCallback(() => setRefresh((r) => r + 1), []);

  // Reload claim data whenever active tab changes (so Summary/Timeline always show fresh data)
  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      setRefresh((r) => r + 1);
    }
  }, [activeTab]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [claimData, statusesData] = await Promise.all([
        getClaim(claimId),
        getClaimStatuses(),
      ]);
      setClaim(claimData.item);
      setStatuses(statusesData.items);
      setSelectedStatus(claimData.item.status?.code || '');
      setBreadcrumbLabel(claimData.item.claimNumber || 'Claim Details');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load(refresh > 0);
  }, [load, refresh]);

  const handleTransition = async (e) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === claim.status?.code) return;
    await updateClaimStatus(claimId, { statusCode: selectedStatus, notes: statusNote });
    setStatusNote('');
    setRefresh((r) => r + 1);
  };

  const tabs = [
    { key: 'summary', label: 'Summary', icon: FileText },
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

          {activeTab === 'summary' && <SummaryTab claim={claim} statuses={statuses} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} statusNote={statusNote} setStatusNote={setStatusNote} onTransition={handleTransition} onEditClaim={() => setShowEdit(true)} onAssignClaim={() => setShowAssign(true)} canEdit={user?.role === 'ADMIN' && !claim.isReadOnly} />}
          {activeTab === 'investigation' && <ClaimInvestigation claimId={claimId} onClaimChange={onClaimChange} />}
          {activeTab === 'documents' && <DocumentsTab claimId={claimId} onClaimChange={onClaimChange} />}
          {activeTab === 'assessment' && <AssessmentTab claimId={claimId} onClaimChange={onClaimChange} />}
          {activeTab === 'settlement' && <SettlementTab claimId={claimId} onClaimChange={onClaimChange} />}
          {activeTab === 'finance' && <ClaimFinance claimId={claimId} onClaimChange={onClaimChange} />}
          {activeTab === 'reports' && <ReportsTab claimId={claimId} onClaimChange={onClaimChange} />}
          {activeTab === 'insurers' && <InsurerPanelTab claim={claim} claimId={claimId} isAdmin={user?.role === 'ADMIN'} onClaimChange={onClaimChange} />}
          {activeTab === 'timeline' && <TimelineTab claim={claim} />}
          {activeTab === 'tasks' && <TasksTab claimId={claimId} onClaimChange={onClaimChange} />}

          <EditClaimModal open={showEdit} onClose={() => setShowEdit(false)} claim={claim} onSaved={() => setRefresh((r) => r + 1)} />
          <AssignClaimModal open={showAssign} onClose={() => setShowAssign(false)} claim={claim} onSaved={() => setRefresh((r) => r + 1)} />
    </div>
  );
}

function SummaryTab({ claim, statuses, selectedStatus, setSelectedStatus, statusNote, setStatusNote, onTransition, onEditClaim, onAssignClaim, canEdit }) {
  const fin = claim.financials || {};

  // Build compact timeline from processHistory + activities + correspondence
  const timelineEvents = [
    ...(claim.processHistory || []).map((h) => ({
      id: `p-${h.id}`,
      type: 'status',
      date: h.createdAt,
      title: h.status?.name || h.status?.code || 'Status Change',
      desc: h.notes,
      actor: h.changedBy,
    })),
    ...(claim.activities || []).map((a) => ({
      id: `a-${a.id}`,
      type: 'activity',
      date: a.occurredAt,
      title: a.activityType?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      desc: a.description,
      actor: a.actor,
    })),
    ...(claim.correspondence || []).map((c) => ({
      id: `c-${c.id}`,
      type: 'correspondence',
      date: c.sentAt,
      title: c.type,
      desc: c.notes,
      actor: c.recipient,
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 12);

  const EVENT_ICONS = {
    status: CheckCircle,
    activity: GitBranch,
    correspondence: FileText,
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
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
          {/* Count badges */}
          <div className="mt-4 pt-4 border-t border-surface-border flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 text-primary text-body-sm font-medium">
              <FileText size={14} />
              {fin.documentCount ?? 0} Documents
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-orange/5 text-accent-orange text-body-sm font-medium">
              <ListTodo size={14} />
              {fin.openTaskCount ?? 0} Open / {fin.taskCount ?? 0} Total Tasks
            </span>
            {claim.processStatus && (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium"
                style={{ backgroundColor: `${claim.processStatus.color}1a`, color: claim.processStatus.color }}
              >
                <GitBranch size={14} />
                {claim.processStatus.name}
              </span>
            )}
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
            <Info label="Assessment Total" value={formatCurrency(fin.assessmentTotal)} money />
            <Info label="Fee Total" value={formatCurrency(fin.feeTotal)} money />
            <Info label="Invoice Total" value={formatCurrency(fin.invoiceTotal)} money />
            <Info label="Payment Total" value={formatCurrency(fin.paymentTotal)} money />
          </div>
        </section>

        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <ListTodo size={18} className="text-primary" />
              <h3 className="text-headline-sm font-semibold text-primary">Assignment</h3>
            </div>
            {canEdit && (
              <button
                onClick={onAssignClaim}
                className="inline-flex items-center gap-1.5 h-9 px-3 border border-outline text-on-surface-variant rounded-lg text-body-sm font-medium hover:bg-surface-container-high hover:text-primary transition-colors"
              >
                <Pencil size={16} />
                Edit Assignment
              </button>
            )}
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
            <h3 className="text-headline-sm font-semibold text-primary">Recent Activity</h3>
          </div>
          {timelineEvents.length ? (
            <ul className="space-y-3 text-body-sm">
              {timelineEvents.map((e) => {
                const Icon = EVENT_ICONS[e.type] || GitBranch;
                const badgeText = e.type === 'status' ? 'text-success' : e.type === 'correspondence' ? 'text-secondary' : 'text-primary';
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
                      {e.actor ? `${e.actor} · ` : ''}{e.date ? new Date(e.date).toLocaleString() : '—'}
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

function Info({ label, value, money, mono }) {
  return (
    <div className="min-w-0">
      <span className="text-label-md text-outline uppercase tracking-wide">{label}</span>
      <p className={`mt-1 text-on-surface break-words ${money || mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  );
}

function DocumentsTab({ claimId, onClaimChange }) {
  const [checklist, setChecklist] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [desc, setDesc] = useState('');
  const [dragging, setDragging] = useState(false);
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
      onClaimChange?.();
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
      onClaimChange?.();
    } catch {
      setError('Failed to mark document as received');
    }
  };

  const handleDelete = (docId) => async () => {
    if (!confirm('Delete this document? The file will be permanently removed.')) return;
    try {
      await deleteDocument(claimId, docId);
      await load();
      onClaimChange?.();
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
          <div className="sm:col-span-3">
            <label className="block text-label-md text-outline uppercase mb-1.5">File</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
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
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
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
          <div className="sm:col-span-2">
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

function AssessmentTab({ claimId, onClaimChange }) {
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
      onClaimChange?.();
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

function SettlementTab({ claimId, onClaimChange }) {
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
      onClaimChange?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settlement');
    } finally {
      setSaving(false);
    }
  };

  const handleOffer = async (e) => {
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
      await createOffer(claimId, offerForm);
      setOfferForm({ offeredAmount: '', notes: '' });
      await load();
      onClaimChange?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create offer');
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
      onClaimChange?.();
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
                  max="9999999999999.99"
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

function ReportsTab({ claimId, onClaimChange }) {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [reportTemplateId, setReportTemplateId] = useState('');
  const [clarification, setClarification] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ items }, { data: tData }] = await Promise.all([
        getReports(claimId),
        api.get('/report-templates'),
      ]);
      setReports(items || []);
      setTemplates(tData.items || []);
    } catch {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { title, notes };
      if (reportTemplateId) payload.reportTemplateId = reportTemplateId;
      await createReport(claimId, payload);
      setTitle('');
      setNotes('');
      setReportTemplateId('');
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to create report draft');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (reportId) => {
    setGenerating(reportId);
    setError(null);
    try {
      await generateReport(claimId, reportId);
      await load();
      onClaimChange?.();
    } catch (err) {
      const serverMsg = err.response?.data?.error || err.message;
      setError(`Failed to generate report: ${serverMsg}`);
    } finally {
      setGenerating(null);
    }
  };

  const handleClarify = async (reportId) => {
    const q = clarification[reportId];
    if (!q?.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await askClarification(claimId, reportId, { question: q });
      setClarification({ ...clarification, [reportId]: '' });
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to send clarification request');
    } finally {
      setSaving(false);
    }
  };

  const REPORT_STATUS_COLORS = {
    DRAFT: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' },
    SUBMITTED: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
    UNDER_REVIEW: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
    APPROVED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
    REJECTED: { bg: 'bg-error/10', text: 'text-error', dot: 'bg-error' },
    CLARIFICATION_REQUESTED: { bg: 'bg-secondary/10', text: 'text-secondary', dot: 'bg-secondary' },
  };

  function StatusPill({ status }) {
    const c = REPORT_STATUS_COLORS[status] || { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
        {status?.replace(/_/g, ' ')}
      </span>
    );
  }

  const draftCount = reports.filter((r) => r.status === 'DRAFT').length;
  const submittedCount = reports.filter((r) => r.status !== 'DRAFT').length;

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

      {/* Summary cards */}
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

      {/* Create draft form */}
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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter report title..."
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Template</label>
            <select
              value={reportTemplateId}
              onChange={(e) => setReportTemplateId(e.target.value)}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            >
              <option value="">Default HTML template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Notes / Summary</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
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

      {/* Reports list */}
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
        reports.map((r) => (
          <div key={r.id} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-surface-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileBarChart size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-body-md font-semibold text-on-surface truncate">{r.title}</p>
                  <p className="text-label-sm text-outline font-mono mt-0.5">
                    Created {new Date(r.createdAt).toLocaleDateString()}
                    {r.generatedAt && ' \u00b7 Generated ' + new Date(r.generatedAt).toLocaleDateString()}
                    {r.generatedBy && ' \u00b7 ' + r.generatedBy.firstName + ' ' + r.generatedBy.lastName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={r.status} />
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {r.notes && (
                <div>
                  <span className="text-label-md text-outline uppercase">Summary</span>
                  <p className="text-body-sm text-on-surface mt-0.5">{r.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border">
                {r.status === 'DRAFT' && (
                  <button
                    onClick={() => handleGenerate(r.id)}
                    disabled={generating === r.id}
                    className="h-9 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileBarChart size={16} />
                    {generating === r.id ? 'Generating...' : 'Generate Report'}
                  </button>
                )}
                {r.pdfPath && (
                  <a
                    href={getDownloadUrl(claimId, r.id, 'pdf')}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download PDF
                  </a>
                )}
                {r.docxPath && (
                  <a
                    href={getDownloadUrl(claimId, r.id, 'docx')}
                    target="_blank"
                    rel="noreferrer"
                    className="h-9 px-4 bg-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    <Download size={16} />
                    Download DOCX
                  </a>
                )}
              </div>

              {/* Clarification form (only for submitted reports) */}
              {r.status !== 'DRAFT' && (
                <div className="pt-3 border-t border-surface-border space-y-2">
                  <span className="text-label-md text-outline uppercase font-medium">Request Clarification</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={clarification[r.id] || ''}
                      onChange={(e) => setClarification({ ...clarification, [r.id]: e.target.value })}
                      placeholder="Ask a clarification question..."
                      className="flex-1 h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                    />
                    <button
                      onClick={() => handleClarify(r.id)}
                      disabled={saving || !clarification[r.id]?.trim()}
                      className="h-10 px-4 bg-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <GitBranch size={16} />
                      Ask
                    </button>
                  </div>
                </div>
              )}

              {/* Clarifications list */}
              {r.clarifications?.length > 0 && (
                <div className="pt-3 border-t border-surface-border">
                  <span className="text-label-md text-outline uppercase">Clarifications</span>
                  <ul className="mt-2 space-y-2">
                    {r.clarifications.map((cl) => (
                      <li key={cl.id} className="p-3 bg-surface-container-low rounded-lg border border-surface-border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-medium ${
                            cl.status === 'ANSWERED' ? 'bg-success/10 text-success' : 'bg-accent-orange/10 text-accent-orange'
                          }`}>
                            {cl.status === 'ANSWERED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                            {cl.status}
                          </span>
                          <span className="text-label-sm text-outline font-mono">
                            {new Date(cl.createdAt).toLocaleDateString()}
                            {cl.askedBy && ' \u00b7 ' + cl.askedBy.firstName + ' ' + cl.askedBy.lastName}
                          </span>
                        </div>
                        <p className="text-body-sm text-on-surface">
                          <span className="text-on-surface-variant">Q:</span> {cl.question}
                        </p>
                        {cl.answer && (
                          <p className="text-body-sm text-on-surface mt-1">
                            <span className="text-on-surface-variant">A:</span> {cl.answer}
                            {cl.answeredBy && <span className="text-outline ml-2">\u00b7 {cl.answeredBy.firstName} {cl.answeredBy.lastName}</span>}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Versions */}
              {r.versions?.length > 0 && (
                <div className="pt-3 border-t border-surface-border">
                  <span className="text-label-md text-outline uppercase">Versions</span>
                  <ul className="mt-2 space-y-1">
                    {r.versions.map((v) => (
                      <li key={v.id} className="flex items-center justify-between p-2 bg-surface-container-low rounded text-body-sm">
                        <span className="text-on-surface">
                          Version {v.versionNumber}
                          <span className="text-on-surface-variant ml-2 font-mono">
                            {new Date(v.generatedAt).toLocaleString()}
                          </span>
                        </span>
                        <div className="flex items-center gap-1">
                          {v.pdfPath && (
                            <a
                              href={getDownloadUrl(claimId, r.id, 'pdf')}
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
        ))
      )}
    </div>
  );
}

function TasksTab({ claimId, onClaimChange }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', assignedToId: '', dueDate: '', priority: 'MEDIUM' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, u] = await Promise.all([
        getTasks({ claimId }),
        getUsers().catch(() => ({ users: [] })),
      ]);
      setTasks(t.items || []);
      setUsers(u.users || []);
    } catch {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assignedToId) return;
    setSaving(true);
    setError(null);
    try {
      await createTask({ ...form, claimId });
      setForm({ title: '', description: '', assignedToId: '', dueDate: '', priority: 'MEDIUM' });
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id, status) => {
    setSaving(true);
    setError(null);
    try {
      await updateTask(id, { status });
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to update task status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    setSaving(true);
    setError(null);
    try {
      await deleteTask(id);
      await load();
      onClaimChange?.();
    } catch {
      setError('Failed to delete task');
    } finally {
      setSaving(false);
    }
  };

  const TASK_STATUS_COLORS = {
    PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', dot: 'bg-accent-orange' },
    IN_PROGRESS: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary' },
    COMPLETED: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
    CANCELLED: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', dot: 'bg-outline' },
  };

  const PRIORITY_COLORS = {
    LOW: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
    MEDIUM: { bg: 'bg-primary/10', text: 'text-primary' },
    HIGH: { bg: 'bg-accent-orange/10', text: 'text-accent-orange' },
    URGENT: { bg: 'bg-error/10', text: 'text-error' },
  };

  function StatusPill({ status }) {
    const c = TASK_STATUS_COLORS[status] || TASK_STATUS_COLORS.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-md font-medium whitespace-nowrap ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`} />
        {status?.replace(/_/g, ' ')}
      </span>
    );
  }

  function isOverdue(task) {
    if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    return new Date(task.dueDate) < new Date();
  }

  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter(isOverdue).length;

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

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ListTodo size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Total Tasks</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{tasks.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Pending</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{pendingCount + inProgressCount}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Completed</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{completedCount}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-error/10 text-error flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Overdue</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{overdueCount}</p>
          </div>
        </div>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ListTodo size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">New Task</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Task title..."
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Assign To</label>
            <select
              value={form.assignedToId}
              onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              required
              disabled={users.length === 0}
            >
              <option value="">{users.length === 0 ? 'No users available' : 'Select user'}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Task description..."
            className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-label-md text-outline uppercase mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !form.title.trim() || !form.assignedToId}
          className="h-10 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {saving ? 'Creating...' : 'Create Task'}
        </button>
      </form>

      {/* Task list */}
      {loading ? (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
          <p className="text-body-md text-on-surface-variant">Loading tasks...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-lg shadow-sm p-8 text-center">
          <ListTodo size={32} className="text-outline mx-auto mb-2" />
          <p className="text-body-md text-on-surface-variant">No tasks yet.</p>
          <p className="text-body-sm text-outline mt-1">Use the form above to create one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => {
            const overdue = isOverdue(t);
            const priorityColor = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.MEDIUM;
            return (
              <div key={t.id} className={`bg-surface border rounded-lg shadow-sm overflow-hidden ${overdue ? 'border-l-4 border-l-error' : 'border-l-4 border-l-primary'}`}>
                <div className="flex items-center justify-between p-3 bg-surface-container-low border-b border-surface-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      t.status === 'COMPLETED' ? 'bg-success/10 text-success' : overdue ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                    }`}>
                      <ListTodo size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-body-md font-semibold text-on-surface truncate ${t.status === 'COMPLETED' ? 'line-through' : ''}`}>
                          {t.title}
                        </p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-label-sm font-medium shrink-0 ${priorityColor.bg} ${priorityColor.text}`}>
                          {t.priority}
                        </span>
                      </div>
                      <p className="text-label-sm text-outline font-mono mt-0.5">
                        Assigned to {t.assignedTo?.firstName} {t.assignedTo?.lastName}
                        {t.createdBy && ` · Created by ${t.createdBy.firstName} ${t.createdBy.lastName}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill status={t.status} />
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {t.description && (
                    <p className="text-body-sm text-on-surface-variant">{t.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-label-sm text-outline font-mono flex-wrap">
                    {t.dueDate && (
                      <span className={overdue ? 'text-error font-medium' : ''}>
                        Due: {new Date(t.dueDate).toLocaleDateString()}
                        {overdue && ' (overdue)'}
                      </span>
                    )}
                    {t.completedAt && (
                      <span className="text-success">Completed: {new Date(t.completedAt).toLocaleDateString()}</span>
                    )}
                    <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-border">
                    {t.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatus(t.id, 'IN_PROGRESS')}
                        disabled={saving}
                        className="h-8 px-3 bg-primary text-white text-label-md rounded font-medium hover:bg-primary-container transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Clock size={12} />
                        Start
                      </button>
                    )}
                    {t.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleStatus(t.id, 'COMPLETED')}
                        disabled={saving}
                        className="h-8 px-3 bg-success text-white text-label-md rounded font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle size={12} />
                        Complete
                      </button>
                    )}
                    {t.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatus(t.id, 'COMPLETED')}
                        disabled={saving}
                        className="h-8 px-3 bg-success text-white text-label-md rounded font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle size={12} />
                        Complete
                      </button>
                    )}
                    {(t.status === 'PENDING' || t.status === 'IN_PROGRESS') && (
                      <button
                        onClick={() => handleStatus(t.id, 'CANCELLED')}
                        disabled={saving}
                        className="h-8 px-3 border border-outline text-on-surface-variant text-label-md rounded font-medium hover:bg-surface-container-high transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Ban size={12} />
                        Cancel
                      </button>
                    )}
                    {t.status === 'CANCELLED' && (
                      <button
                        onClick={() => handleStatus(t.id, 'PENDING')}
                        disabled={saving}
                        className="h-8 px-3 border border-outline text-on-surface-variant text-label-md rounded font-medium hover:bg-surface-container-high transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={saving}
                      className="h-8 px-3 text-error text-label-md rounded font-medium hover:bg-error/10 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 ml-auto"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InsurerPanelTab({ claim: initialClaim, claimId, isAdmin, onClaimChange }) {
  const [insurers, setInsurers] = useState([]);
  const [panel, setPanel] = useState(initialClaim?.insurerPanel || []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
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
  const [error, setError] = useState(null);

  const loadInsurers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await getInsuranceCompanies();
      setInsurers(res.items || []);
    } catch {
      setError('Failed to load insurance companies');
    }
  }, [isAdmin]);

  const loadPanel = useCallback(async () => {
    try {
      const res = await getClaim(claimId);
      setPanel(res.item?.insurerPanel || []);
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

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.insuranceCompanyId) return;
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

  const handleEdit = (ci) => {
    setEditingId(ci.id);
    setShowForm(true);
    setForm({
      insuranceCompanyId: ci.insuranceCompany?.id?.toString() || '',
      isLead: ci.isLead || false,
      participationPercent: ci.participationPercent?.toString() || '',
      insurerClaimNumber: ci.insurerClaimNumber || '',
      proposedSettlement: ci.proposedSettlement?.toString() || '',
      agreedSettlement: ci.agreedSettlement?.toString() || '',
      paidAmount: ci.paidAmount?.toString() || '',
      offerStatus: ci.offerStatus || '',
      paymentStatus: ci.paymentStatus || '',
      notes: ci.notes || '',
    });
  };

  const handleToggleLead = async (ci) => {
    setSaving(true);
    setError(null);
    try {
      await updateClaimInsurer(claimId, ci.id, { isLead: !ci.isLead });
      await loadPanel();
      onClaimChange?.();
    } catch {
      setError('Failed to toggle lead status');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (ci) => {
    if (!confirm(`Remove ${ci.insuranceCompany?.name} from the panel?`)) return;
    setSaving(true);
    setError(null);
    try {
      await removeClaimInsurer(claimId, ci.id);
      await loadPanel();
      onClaimChange?.();
    } catch {
      setError('Failed to remove insurer');
    } finally {
      setSaving(false);
    }
  };

  const leadInsurer = panel.find((ci) => ci.isLead);
  const totalParticipation = panel.reduce((sum, ci) => sum + (Number(ci.participationPercent) || 0), 0);

  const OFFER_STATUS_COLORS = {
    PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange' },
    ACCEPTED: { bg: 'bg-success/10', text: 'text-success' },
    REJECTED: { bg: 'bg-error/10', text: 'text-error' },
    COUNTERED: { bg: 'bg-primary/10', text: 'text-primary' },
  };

  const PAYMENT_STATUS_COLORS = {
    PENDING: { bg: 'bg-accent-orange/10', text: 'text-accent-orange' },
    PARTIAL: { bg: 'bg-primary/10', text: 'text-primary' },
    PAID: { bg: 'bg-success/10', text: 'text-success' },
    NONE: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' },
  };

  function StatusBadge({ status, colors }) {
    if (!status) return <span className="text-on-surface-variant">—</span>;
    const c = colors[status] || { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' };
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

      {/* Summary cards */}
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
            <p className="text-body-sm font-semibold text-on-surface truncate">{leadInsurer?.insuranceCompany?.name || 'None'}</p>
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

        {/* Add/Edit form */}
        {showForm && isAdmin && (
          <form onSubmit={handleAdd} className="p-4 bg-surface-container-low border-b border-surface-border space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={16} className="text-primary" />
              <h4 className="text-body-md font-semibold text-primary">{editingId ? 'Edit Insurer' : 'Add Insurer to Panel'}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Insurance Company</label>
                <select
                  value={form.insuranceCompanyId}
                  onChange={(e) => setForm({ ...form, insuranceCompanyId: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  required
                  disabled={!!editingId}
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
                  min="0"
                  max="100"
                  value={form.participationPercent}
                  onChange={(e) => setForm({ ...form, participationPercent: e.target.value })}
                  placeholder="e.g. 50"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Insurer Claim #</label>
                <input
                  type="text"
                  value={form.insurerClaimNumber}
                  onChange={(e) => setForm({ ...form, insurerClaimNumber: e.target.value })}
                  placeholder="Claim reference"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Proposed Settlement</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.proposedSettlement}
                  onChange={(e) => setForm({ ...form, proposedSettlement: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Agreed Settlement</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.agreedSettlement}
                  onChange={(e) => setForm({ ...form, agreedSettlement: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Paid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Offer Status</label>
                <select
                  value={form.offerStatus}
                  onChange={(e) => setForm({ ...form, offerStatus: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                >
                  <option value="">None</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="COUNTERED">Countered</option>
                </select>
              </div>
              <div>
                <label className="block text-label-md text-outline uppercase mb-1.5">Payment Status</label>
                <select
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                  className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                >
                  <option value="">None</option>
                  <option value="PENDING">Pending</option>
                  <option value="PARTIAL">Partial</option>
                  <option value="PAID">Paid</option>
                </select>
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
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !form.insuranceCompanyId}
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

        {/* Panel list */}
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
              {panel.map((ci) => (
                <div key={ci.id} className="bg-surface-container-low border border-surface-border rounded-lg overflow-hidden">
                  {/* Header row */}
                  <div className="flex items-center justify-between p-3 border-b border-surface-border">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        ci.isLead ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        <Building2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-body-md font-semibold text-on-surface truncate">{ci.insuranceCompany?.name}</p>
                          {ci.isLead && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-medium bg-primary/10 text-primary shrink-0">
                              <CheckCircle size={10} />
                              Lead
                            </span>
                          )}
                        </div>
                        <p className="text-label-sm text-outline font-mono mt-0.5">
                          {ci.insuranceCompany?.code && `Code: ${ci.insuranceCompany.code}`}
                          {ci.insurerClaimNumber && ` \u00b7 Claim #: ${ci.insurerClaimNumber}`}
                          {ci.participationPercent && ` \u00b7 ${ci.participationPercent}%`}
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
                            ci.isLead ? 'text-primary hover:bg-primary/10' : 'text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                          title={ci.isLead ? 'Remove lead' : 'Set as lead'}
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

                  {/* Financial details */}
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-body-sm">
                    <div>
                      <p className="text-label-md text-outline uppercase">Proposed</p>
                      <p className="font-mono text-on-surface mt-0.5">{ci.proposedSettlement ? formatCurrency(ci.proposedSettlement) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-label-md text-outline uppercase">Agreed</p>
                      <p className="font-mono text-on-surface mt-0.5">{ci.agreedSettlement ? formatCurrency(ci.agreedSettlement) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-label-md text-outline uppercase">Paid</p>
                      <p className="font-mono text-on-surface mt-0.5">{ci.paidAmount ? formatCurrency(ci.paidAmount) : '—'}</p>
                    </div>
                    <div>
                      <p className="text-label-md text-outline uppercase">Balance</p>
                      <p className="font-mono text-on-surface mt-0.5">
                        {ci.agreedSettlement && ci.paidAmount ? formatCurrency(Number(ci.agreedSettlement) - Number(ci.paidAmount)) : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="px-3 pb-3 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-label-md text-outline uppercase">Offer:</span>
                      <StatusBadge status={ci.offerStatus} colors={OFFER_STATUS_COLORS} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-label-md text-outline uppercase">Payment:</span>
                      <StatusBadge status={ci.paymentStatus} colors={PAYMENT_STATUS_COLORS} />
                    </div>
                    {ci.notes && (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-label-md text-outline uppercase shrink-0">Notes:</span>
                        <span className="text-body-sm text-on-surface-variant truncate">{ci.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function TimelineTab({ claim }) {
  const [filter, setFilter] = useState('all');

  const activities = (claim.activities || []).map((a) => ({
    id: `a-${a.id}`,
    type: 'activity',
    date: a.occurredAt,
    title: a.activityType,
    desc: a.description,
    actor: a.actor,
    source: a.source,
  }));
  const correspondence = (claim.correspondence || []).map((c) => ({
    id: `c-${c.id}`,
    type: 'correspondence',
    date: c.sentAt,
    title: c.type,
    desc: c.notes,
    actor: c.recipient,
    source: null,
    followUp: c.followUpDate,
    isHistorical: c.isHistorical,
  }));
  const statusChanges = (claim.processHistory || []).map((h) => ({
    id: `s-${h.id}`,
    type: 'status',
    date: h.createdAt,
    title: h.status?.name || h.status?.code || 'Status Change',
    desc: h.notes,
    actor: h.changedBy,
    source: h.isOverride ? `Override: ${h.overrideReason}` : null,
  }));

  const allEvents = [...activities, ...correspondence, ...statusChanges].sort(
    (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
  );

  const filteredEvents = filter === 'all' ? allEvents : allEvents.filter((e) => e.type === filter);

  const EVENT_CONFIG = {
    activity: { icon: GitBranch, badgeBg: 'bg-primary/10', badgeText: 'text-primary' },
    correspondence: { icon: FileText, badgeBg: 'bg-secondary/10', badgeText: 'text-secondary' },
    status: { icon: CheckCircle, badgeBg: 'bg-success/10', badgeText: 'text-success' },
  };

  const filters = [
    { key: 'all', label: 'All Events', count: allEvents.length },
    { key: 'activity', label: 'Activities', count: activities.length },
    { key: 'correspondence', label: 'Correspondence', count: correspondence.length },
    { key: 'status', label: 'Status Changes', count: statusChanges.length },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Clock size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Total Events</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{allEvents.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <GitBranch size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Activities</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{activities.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <FileText size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Correspondence</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{correspondence.length}</p>
          </div>
        </div>
        <div className="bg-surface border border-surface-border rounded-lg p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/10 text-success flex items-center justify-center shrink-0">
            <CheckCircle size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-label-md text-outline uppercase truncate">Status Changes</p>
            <p className="text-headline-sm font-semibold text-on-surface font-mono tabular-nums">{statusChanges.length}</p>
          </div>
        </div>
      </div>

      <section className="bg-surface border border-surface-border border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-surface-container-low border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Activity Timeline</h3>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-3 border-b border-surface-border overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap ${
                filter === f.key ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded text-label-sm font-mono ${
                filter === f.key ? 'bg-white/20' : 'bg-surface-container-high'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="p-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={32} className="text-outline mx-auto mb-2" />
              <p className="text-body-md text-on-surface-variant">
                {filter === 'all'
                  ? 'No events recorded yet.'
                  : `No ${filter} events recorded.`}
              </p>
              <p className="text-body-sm text-outline mt-1">
                Events will appear here as the claim progresses through the workflow.
              </p>
            </div>
          ) : (
            <ul className="space-y-0">
              {filteredEvents.map((evt, i) => {
                const config = EVENT_CONFIG[evt.type] || EVENT_CONFIG.activity;
                const Icon = config.icon;
                const isLast = i === filteredEvents.length - 1;
                return (
                  <li key={evt.id} className="relative pl-10 pb-6 last:pb-0">
                    {!isLast && (
                      <span className="absolute left-[15px] top-8 bottom-0 w-px bg-surface-border" />
                    )}
                    <span className={`absolute left-0 top-1 w-8 h-8 rounded-full ${config.badgeBg} ${config.badgeText} flex items-center justify-center ring-4 ring-surface`}>
                      <Icon size={16} />
                    </span>
                    <div className="bg-surface-container-low border border-surface-border rounded-lg p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-md font-medium ${config.badgeBg} ${config.badgeText}`}>
                          {evt.type}
                        </span>
                        <p className="font-medium text-body-md text-on-surface">{evt.title}</p>
                        {evt.isHistorical && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-label-sm font-medium bg-accent-orange/10 text-accent-orange">
                            Historical
                          </span>
                        )}
                      </div>
                      {evt.desc && (
                        <p className="text-body-sm text-on-surface-variant mt-1.5">{evt.desc}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-label-sm text-outline font-mono flex-wrap">
                        <span>
                          {evt.date ? new Date(evt.date).toLocaleString() : 'No date'}
                        </span>
                        {evt.actor && <span>· {evt.actor}</span>}
                        {evt.source && <span>· {evt.source}</span>}
                        {evt.followUp && (
                          <span className="text-accent-orange">· Follow-up: {new Date(evt.followUp).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
