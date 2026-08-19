import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getClaim, updateClaimStatus } from '../services/claim.service.js';
import { getClaimStatuses } from '../services/master-data.service.js';
import { getDocuments, uploadDocument, markDocumentReceived, deleteDocument } from '../services/document.service.js';
import { getAssessments, createAssessment, deleteAssessment } from '../services/assessment.service.js';
import { getSettlement, saveSettlement, getOffers, createOffer, respondToOffer } from '../services/settlement.service.js';
import { getReports, createReport, generateReport, askClarification } from '../services/report.service.js';
import { getTasks, createTask, updateTask } from '../services/task.service.js';
import { getUsers } from '../services/user.service.js';
import { getDocumentCategories } from '../services/master-data.service.js';
import { api } from '../services/api.js';
import ClaimInvestigation from '../components/ClaimInvestigation.jsx';
import ClaimFinance from '../components/ClaimFinance.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';

export default function ClaimDetail() {
  const { id } = useParams();
  const [claim, setClaim] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [claimData, statusesData] = await Promise.all([getClaim(id), getClaimStatuses()]);
    setClaim(claimData.item);
    setStatuses(statusesData.items);
    setSelectedStatus(claimData.item.status?.code || '');
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load, refresh]);

  const handleTransition = async (e) => {
    e.preventDefault();
    if (!selectedStatus || selectedStatus === claim.status?.code) return;
    await updateClaimStatus(id, { statusCode: selectedStatus, notes: statusNote });
    setStatusNote('');
    setRefresh((r) => r + 1);
  };

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'investigation', label: 'Investigation' },
    { key: 'documents', label: 'Documents' },
    { key: 'assessment', label: 'Assessment' },
    { key: 'settlement', label: 'Settlement' },
    { key: 'finance', label: 'Finance' },
    { key: 'reports', label: 'Reports' },
    { key: 'tasks', label: 'Tasks' },
  ];

  if (loading || !claim) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-[260px]">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">Loading...</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-headline-lg font-semibold text-primary">{claim.claimNumber}</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                {claim.claimType?.name} · {claim.client?.name}
              </p>
            </div>
            <div
              className="px-4 py-1.5 rounded-full text-label-md font-medium"
              style={{ backgroundColor: `${claim.status?.color}20`, color: claim.status?.color }}
            >
              {claim.status?.code}
            </div>
          </div>

          <div className="flex gap-2 border-b border-surface-border mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 text-body-md font-medium border-b-2 transition-colors ${
                  activeTab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'summary' && <SummaryTab claim={claim} statuses={statuses} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} statusNote={statusNote} setStatusNote={setStatusNote} onTransition={handleTransition} />}
          {activeTab === 'investigation' && <ClaimInvestigation claimId={id} />}
          {activeTab === 'documents' && <DocumentsTab claimId={id} />}
          {activeTab === 'assessment' && <AssessmentTab claimId={id} />}
          {activeTab === 'settlement' && <SettlementTab claimId={id} />}
          {activeTab === 'finance' && <ClaimFinance claimId={id} />}
          {activeTab === 'reports' && <ReportsTab claimId={id} />}
          {activeTab === 'tasks' && <TasksTab claimId={id} />}
        </main>
      </div>
    </div>
  );
}

function SummaryTab({ claim, statuses, selectedStatus, setSelectedStatus, statusNote, setStatusNote, onTransition }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
          <h3 className="text-headline-sm font-semibold text-primary mb-4">Claim Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-body-md">
            <Info label="Policy" value={claim.policy?.policyNumber} />
            <Info label="Insurer" value={claim.insuranceCompany?.name} />
            <Info label="Date of Loss" value={claim.dateOfLoss ? new Date(claim.dateOfLoss).toLocaleDateString() : '—'} />
            <Info label="Received" value={new Date(claim.dateReceived).toLocaleDateString()} />
            <Info label="Estimated Loss" value={claim.estimatedLoss ? `$${claim.estimatedLoss}` : '—'} money />
            <Info label="Reserve" value={claim.reserve ? `$${claim.reserve}` : '—'} money />
          </div>
          <div className="mt-4">
            <span className="text-label-md text-outline uppercase">Description</span>
            <p className="text-body-md mt-1">{claim.description}</p>
          </div>
        </section>

        <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
          <h3 className="text-headline-sm font-semibold text-primary mb-4">Assignment</h3>
          <div className="grid grid-cols-2 gap-4 text-body-md">
            <Info label="Engineer" value={claim.engineer?.fullName} />
            <Info label="Accountant" value={claim.accountant?.fullName} />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
          <h3 className="text-headline-sm font-semibold text-primary mb-4">Update Status</h3>
          <form onSubmit={onTransition} className="space-y-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            >
              {statuses.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              rows={3}
              placeholder="Notes"
              className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary"
            />
            <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors">
              Update Status
            </button>
          </form>
        </section>

        <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
          <h3 className="text-headline-sm font-semibold text-primary mb-4">Status History</h3>
          <ul className="space-y-3 text-body-sm">
            {claim.history?.length ? (
              claim.history.map((h) => (
                <li key={h.id} className="border-l-2 border-primary pl-3">
                  <p className="font-medium">{h.status?.code}</p>
                  <p className="text-on-surface-variant">{h.notes || 'No notes'}</p>
                  <p className="text-label-sm text-outline mt-1">
                    {h.changedBy} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-on-surface-variant">No history yet.</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value, money }) {
  return (
    <div>
      <span className="text-label-md text-outline uppercase">{label}</span>
      <p className={`mt-1 ${money ? 'font-mono' : ''}`}>{value || '—'}</p>
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

  const load = async () => {
    setLoading(true);
    const [docData, catData] = await Promise.all([getDocuments(claimId), getDocumentCategories()]);
    setChecklist(docData.items || []);
    setCategories(catData.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [claimId]);

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
      <form onSubmit={handleUpload} className="bg-surface border border-surface-border rounded shadow-sm p-4 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-body-sm font-semibold mb-1.5">File</label>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-body-md" />
        </div>
        <div>
          <label className="block text-body-sm font-semibold mb-1.5">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-10 px-3 rounded border border-outline bg-surface text-body-md">
            <option value="">Select</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description"
          className="h-10 px-3 rounded border border-outline bg-surface text-body-md"
        />
        <button type="submit" className="h-10 px-4 bg-primary text-white rounded font-semibold hover:bg-primary-container transition-colors">
          Upload
        </button>
      </form>

      {checklist.map((group) => (
        <div key={group.category?.id || 'unknown'} className="bg-surface border border-surface-border rounded shadow-sm p-4">
          <h4 className="text-body-lg font-semibold text-primary mb-3">{group.category?.name || 'Uncategorized'}</h4>
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

  const load = async () => {
    const { items } = await getAssessments(claimId);
    setAssessments(items || []);
  };

  useEffect(() => {
    load();
  }, [claimId]);

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
      <form onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded shadow-sm p-4 space-y-4">
        <h3 className="text-headline-sm font-semibold text-primary">New Assessment</h3>
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
          <p className="font-mono text-body-lg font-semibold text-primary">Total: ${total.toFixed(2)}</p>
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
              <p className="font-mono text-headline-sm font-semibold text-primary">${a.totalAmount}</p>
              <button onClick={() => handleDelete(a.id)} className="text-red-600 text-label-md hover:underline">Delete</button>
            </div>
          </div>
          <ul className="text-body-md divide-y divide-surface-border">
            {a.items.map((it) => (
              <li key={it.id} className="py-2 flex justify-between">
                <span>{it.description} × {it.quantity} @ ${it.unitCost}</span>
                <span className="font-mono">${it.amount}</span>
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

  const load = async () => {
    const [s, o] = await Promise.all([getSettlement(claimId), getOffers(claimId)]);
    if (s.item) setForm({ ...s.item, settlementDate: s.item.settlementDate?.slice(0, 10) || '' });
    setOffers(o.items || []);
  };

  useEffect(() => {
    load();
  }, [claimId]);

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
        <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
          <h3 className="text-headline-sm font-semibold text-primary mb-4">Settlement</h3>
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

        <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
          <h3 className="text-headline-sm font-semibold text-primary mb-4">New Offer</h3>
          <form onSubmit={handleOffer} className="space-y-4">
            <input type="number" step="0.01" value={offerForm.offeredAmount} onChange={(e) => setOfferForm({ ...offerForm, offeredAmount: e.target.value })} placeholder="Offered amount" className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md" />
            <textarea value={offerForm.notes} onChange={(e) => setOfferForm({ ...offerForm, notes: e.target.value })} placeholder="Notes" className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md" />
            <button type="submit" className="w-full h-10 bg-primary text-white font-semibold rounded hover:bg-primary-container transition-colors">Create Offer</button>
          </form>
        </section>
      </div>

      <section className="bg-surface border border-surface-border rounded shadow-sm p-6">
        <h3 className="text-headline-sm font-semibold text-primary mb-4">Offers</h3>
        <div className="space-y-4">
          {offers.map((o) => (
            <div key={o.id} className="p-3 bg-surface-container-low rounded">
              <div className="flex justify-between items-center">
                <p className="font-mono text-body-lg font-semibold">${o.offeredAmount}</p>
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

  const load = async () => {
    const [{ items }, { data: tData }] = await Promise.all([getReports(claimId), api.get('/report-templates')]);
    setReports(items || []);
    setTemplates(tData.items || []);
  };

  useEffect(() => {
    load();
  }, [claimId]);

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
        <h3 className="text-headline-sm font-semibold text-primary">New Report Draft</h3>
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

  const load = async () => {
    const [t, u] = await Promise.all([getTasks({ claimId }), getUsers()]);
    setTasks(t.items || []);
    setUsers(u.users || []);
  };

  useEffect(() => {
    load();
  }, [claimId]);

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
        <h3 className="text-headline-sm font-semibold text-primary">New Task</h3>
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
