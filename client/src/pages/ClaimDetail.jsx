import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClaim, updateClaimStatus } from '../services/claim.service.js';
import { getClaimStatuses } from '../services/master-data.service.js';
import { getProcessStatuses, updateProcessStatus, getClosingGuards } from '../services/import.service.js';
import { getDocuments, uploadDocument, markDocumentReceived, deleteDocument } from '../services/document.service.js';
import { getAssessments, createAssessment, deleteAssessment } from '../services/assessment.service.js';
import { getSettlement, saveSettlement, getOffers, createOffer, respondToOffer } from '../services/settlement.service.js';
import { getReports, createReport, generateReport, askClarification } from '../services/report.service.js';
import { getTasks, createTask, updateTask } from '../services/task.service.js';
import { getUsers } from '../services/user.service.js';
import { getDocumentCategories } from '../services/master-data.service.js';
import { api } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClaimInvestigation from '../components/ClaimInvestigation.jsx';
import ClaimFinance from '../components/ClaimFinance.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { setBreadcrumbLabel } from '../components/Breadcrumbs.jsx';
import { Lock, Ban, AlertTriangle, FileText, GitBranch, Search, FolderOpen, ClipboardCheck, Handshake, Wallet, FileBarChart, Building2, Clock, ListTodo, ArrowLeft } from 'lucide-react';

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
  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [desc, setDesc] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [docData, catData] = await Promise.all([getDocuments(claimId), getDocumentCategories()]);
    setChecklist(docData.items || []);
    setCategories(catData.items || []);
    setLoading(false);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !categoryId) return;
    const form = new FormData();
    form.append('file', file);
    form.append('documentCategoryId', categoryId);
    form.append('description', desc);
    await uploadDocument(claimId, form);
    setFile(null);
    setCategoryId('');
    setDesc('');
    await load();
  };

  const handleMark = (cat, docId) => async () => {
    await markDocumentReceived(claimId, docId);
    await load();
  };

  const handleDelete = (docId) => async () => {
    await deleteDocument(claimId, docId);
    await load();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={handleUpload} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-label-md text-outline uppercase mb-1.5">File</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-body-md" />
        </div>
        <div>
          <label className="block text-label-md text-outline uppercase mb-1.5">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30">
            <option value="">Select</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-label-md text-outline uppercase mb-1.5">Description</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description"
            className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors inline-flex items-center gap-2">
          <FolderOpen size={16} />
          Upload
        </button>
      </form>

      {checklist.map((group) => (
        <div key={group.category?.id || 'unknown'} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen size={16} className="text-primary" />
            <h4 className="text-body-lg font-semibold text-primary">{group.category?.name || 'Uncategorized'}</h4>
          </div>
          <ul className="space-y-2">
            {group.uploaded?.length ? (
              group.uploaded.map((doc) => (
                <li key={doc.id} className="flex justify-between items-center p-2 bg-surface-container-low rounded text-body-md">
                  <div>
                    <p className="font-medium">{doc.originalName}</p>
                    <p className="text-label-sm text-outline">{doc.description || 'No description'} · {new Date(doc.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {!doc.isReceived && (
                      <button onClick={handleMark(group, doc.id)} className="px-3 py-1 bg-success text-white text-label-md rounded hover:opacity-90">
                        Mark Received
                      </button>
                    )}
                    <button onClick={handleDelete(doc.id)} className="px-3 py-1 bg-red-600 text-white text-label-md rounded hover:opacity-90">
                      Delete
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-body-md text-on-surface-variant">No documents uploaded yet.</p>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

function AssessmentTab({ claimId }) {
  const [assessments, setAssessments] = useState([]);
  const [items, setItems] = useState([{ description: '', quantity: 1, unitCost: 0 }]);
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    const { items } = await getAssessments(claimId);
    setAssessments(items || []);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitCost: 0 }]);

  const updateItem = (idx, field, value) => {
    const next = [...items];
    next[idx][field] = field === 'description' ? value : Number(value);
    setItems(next);
  };

  const total = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitCost || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createAssessment(claimId, { notes, items });
    setNotes('');
    setItems([{ description: '', quantity: 1, unitCost: 0 }]);
    await load();
  };

  const handleDelete = async (id) => {
    await deleteAssessment(claimId, id);
    await load();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded-lg shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardCheck size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">New Assessment</h3>
        </div>
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={it.description}
              onChange={(e) => updateItem(idx, 'description', e.target.value)}
              placeholder="Description"
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md"
              required
            />
            <input
              type="number"
              value={it.quantity}
              onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
              placeholder="Qty"
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md"
              required
            />
            <input
              type="number"
              step="0.01"
              value={it.unitCost}
              onChange={(e) => updateItem(idx, 'unitCost', e.target.value)}
              placeholder="Unit cost"
              className="h-10 px-3 rounded border border-outline bg-surface text-body-md"
              required
            />
          </div>
        ))}
        <div className="flex justify-between items-center">
          <button type="button" onClick={addItem} className="text-primary text-body-md font-semibold hover:underline">
            + Add Line
          </button>
          <p className="font-mono text-body-lg font-semibold text-primary">Total: {formatCurrency(total)}</p>
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
        <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors">
          Save Assessment
        </button>
      </form>

      {assessments.map((a) => (
        <div key={a.id} className="bg-surface border border-surface-border rounded shadow-sm p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-body-md text-on-surface-variant">{new Date(a.assessmentDate).toLocaleString()}</p>
              <p className="text-body-md">{a.notes}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-headline-sm font-semibold text-primary">{formatCurrency(a.totalAmount)}</p>
              <button onClick={() => handleDelete(a.id)} className="text-red-600 text-label-md hover:underline">Delete</button>
            </div>
          </div>
          <ul className="text-body-md divide-y divide-surface-border">
            {a.items.map((it) => (
              <li key={it.id} className="py-2 flex justify-between">
                <span>{it.description} × {it.quantity} @ {formatCurrency(it.unitCost)}</span>
                <span className="font-mono">{formatCurrency(it.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SettlementTab({ claimId }) {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({ settledAmount: '', settlementDate: '', status: 'PENDING', notes: '' });
  const [offerForm, setOfferForm] = useState({ offeredAmount: '', notes: '' });
  const [response, setResponse] = useState({});

  const load = useCallback(async () => {
    const [s, o] = await Promise.all([getSettlement(claimId), getOffers(claimId)]);
    if (s.item) setForm({ ...s.item, settlementDate: s.item.settlementDate?.slice(0, 10) || '' });
    setOffers(o.items || []);
  }, [claimId]);

  useEffect(() => {
    load();
  }, [claimId, load]);

  const handleSave = async (e) => {
    e.preventDefault();
    await saveSettlement(claimId, form);
    await load();
  };

  const handleOffer = async (e) => {
    e.preventDefault();
    await createOffer(claimId, offerForm);
    setOfferForm({ offeredAmount: '', notes: '' });
    await load();
  };

  const handleResponse = async (offerId) => {
    await respondToOffer(claimId, offerId, response[offerId]);
    setResponse({ ...response, [offerId]: {} });
    await load();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Handshake size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">Settlement</h3>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <input type="date" value={form.settlementDate} onChange={(e) => setForm({ ...form, settlementDate: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <input type="number" step="0.01" value={form.settledAmount} onChange={(e) => setForm({ ...form, settledAmount: e.target.value })} placeholder="Settled amount" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md">
              <option value="PENDING">Pending</option>
              <option value="AGREED">Agreed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
            <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors">Save Settlement</button>
          </form>
        </section>

        <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Handshake size={18} className="text-primary" />
            <h3 className="text-headline-sm font-semibold text-primary">New Offer</h3>
          </div>
          <form onSubmit={handleOffer} className="space-y-4">
            <input type="number" step="0.01" value={offerForm.offeredAmount} onChange={(e) => setOfferForm({ ...offerForm, offeredAmount: e.target.value })} placeholder="Offered amount" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <textarea value={offerForm.notes} onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })} placeholder="Notes" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
            <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors">Create Offer</button>
          </form>
        </section>
      </div>

      <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Handshake size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">Offers</h3>
        </div>
        <div className="space-y-4">
          {offers.map((o) => (
            <div key={o.id} className="p-3 bg-surface-container-low rounded">
              <div className="flex justify-between items-center">
                <p className="font-mono text-body-lg font-semibold">{formatCurrency(o.offeredAmount)}</p>
                <span className="px-2 py-0.5 rounded text-label-md font-medium" style={{ background: o.status === 'ACCEPTED' ? '#e8f5e9' : '#fff3e0', color: o.status === 'ACCEPTED' ? '#28a745' : '#f26522' }}>
                  {o.status}
                </span>
              </div>
              <p className="text-body-md mt-1">{o.notes}</p>
              {o.status === 'PENDING' && (
                <div className="mt-3 flex gap-2">
                  <select
                    value={response[o.id]?.status || ''}
                    onChange={(e) => setResponse({ ...response, [o.id]: { ...response[o.id], status: e.target.value } })}
                    className="h-10 px-3 rounded border border-outline bg-surface text-body-md"
                  >
                    <option value="">Respond</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <input
                    type="text"
                    value={response[o.id]?.notes || ''}
                    onChange={(e) => setResponse({ ...response, [o.id]: { ...response[o.id], notes: e.target.value } })}
                    placeholder="Response notes"
                    className="flex-1 h-10 px-3 rounded border border-outline bg-surface text-body-md"
                  />
                  <button onClick={() => handleResponse(o.id)} className="h-10 px-3 bg-primary text-white rounded font-semibold">Submit</button>
                </div>
              )}
            </div>
          ))}
          {offers.length === 0 && <p className="text-body-md text-on-surface-variant">No offers yet.</p>}
        </div>
      </section>
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
      <form onSubmit={handleCreate} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
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
        <div key={r.id} className="bg-surface border border-surface-border rounded shadow-sm p-4">
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
    const [t, u] = await Promise.all([getTasks({ claimId }), getUsers()]);
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
      <form onSubmit={handleCreate} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ListTodo size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">New Task</h3>
        </div>
        <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" required />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
        <select value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" required>
          <option value="">Assign to</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName} ({u.role})
            </option>
          ))}
        </select>
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
        <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold">Create Task</button>
      </form>

      <div className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-3">
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
            <p className="text-label-md text-outline uppercase">Current Process Status</p>
            {claim.processStatus && (
              <div
                className="inline-block mt-1 px-4 py-1.5 rounded-full text-label-md font-medium"
                style={{ backgroundColor: `${claim.processStatus.color}20`, color: claim.processStatus.color }}
              >
                {claim.processStatus.name}
              </div>
            )}
          </div>

          {claim.isReadOnly && (
            <div className="mb-4 bg-amber-50 border border-amber-300 rounded p-3 text-amber-800 text-body-sm">
              <p className="font-medium">This is a read-only historical record.</p>
              <p className="mt-0.5">Any status change requires an Admin override with a reason.</p>
            </div>
          )}

          {isAdmin && (
            <form onSubmit={onTransition} className="space-y-4">
              <select
                value={selectedProcessStatus}
                onChange={(e) => setSelectedProcessStatus(e.target.value)}
                className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
              >
                {processStatuses.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
              <textarea
                value={processNote}
                onChange={(e) => setProcessNote(e.target.value)}
                rows={3}
                placeholder="Notes"
                className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
              />
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
                  <label className="block text-label-md text-on-surface-variant mb-1">
                    Override reason {claim.isReadOnly ? '(required for read-only records)' : '(Admin only)'}
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide a reason to override"
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
                  />
                </div>
              )}
              <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors">
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
          <ul className="space-y-3 text-body-sm">
            {claim.processHistory?.length ? (
              claim.processHistory.map((h) => (
                <li key={h.id} className="border-l-2 border-primary pl-3">
                  <p className="font-medium">{h.status?.name || h.status?.code}</p>
                  <p className="text-on-surface-variant">{h.notes || 'No notes'}</p>
                  {h.isOverride && <p className="text-label-sm text-error">Override: {h.overrideReason}</p>}
                  <p className="text-label-sm text-outline mt-1">
                    {h.changedBy} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-on-surface-variant">No process history yet.</p>
            )}
          </ul>
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

function InsurerPanelTab({ claim, claimId: _claimId, isAdmin }) {
  const panel = claim.insurerPanel || [];
  return (
    <div className="space-y-6">
      <section className="bg-surface border border-surface-border rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-primary" />
          <h3 className="text-headline-sm font-semibold text-primary">Insurer Panel</h3>
        </div>
        {panel.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">No insurers on the panel. Use the API to add panel members.</p>
        ) : (
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-left text-on-surface-variant border-b border-surface-border">
                <th className="py-2 pr-4">Insurer</th>
                <th className="py-2 pr-4">Lead</th>
                <th className="py-2 pr-4">Participation</th>
                <th className="py-2 pr-4">Insurer Claim #</th>
              </tr>
            </thead>
            <tbody>
              {panel.map((ci) => (
                <tr key={ci.id} className="border-b border-surface-border/50">
                  <td className="py-2 pr-4 text-on-surface">{ci.insuranceCompany?.name}</td>
                  <td className="py-2 pr-4">{ci.isLead ? <span className="text-primary font-medium">Yes</span> : '—'}</td>
                  <td className="py-2 pr-4 text-on-surface-variant">{ci.participationPercent ? `${ci.participationPercent}%` : '—'}</td>
                  <td className="py-2 pr-4 text-on-surface-variant">{ci.insurerClaimNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isAdmin && panel.length === 0 && (
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
              <li key={i} className="border-l-2 border-primary pl-4 relative">
                <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-primary" />
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-label-sm ${evt.type === 'activity' ? 'bg-primary-container/20 text-primary' : 'bg-surface-variant/20 text-on-surface-variant'}`}>
                    {evt.type}
                  </span>
                  <p className="font-medium text-body-md">{evt.title}</p>
                </div>
                {evt.desc && <p className="text-body-sm text-on-surface-variant mt-1">{evt.desc}</p>}
                <p className="text-label-sm text-outline mt-1">
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
