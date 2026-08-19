import { useEffect, useState, useRef } from 'react';
import {
  getTemplates,
  createTemplate,
  deleteTemplate,
  setDefaultTemplate,
  downloadTemplate,
} from '../services/report-template.service.js';
import { Sidebar } from '../components/Sidebar.jsx';
import { TopBar } from '../components/TopBar.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Star,
  StarOff,
  FileType,
  CheckCircle2,
  Calendar,
  FileUp,
} from 'lucide-react';

const PLACEHOLDERS = [
  { token: '{claimNumber}', label: 'Claim Number' },
  { token: '{clientName}', label: 'Client Name' },
  { token: '{insurerName}', label: 'Insurer Name' },
  { token: '{claimType}', label: 'Claim Type' },
  { token: '{engineerName}', label: 'Engineer Name' },
  { token: '{statusName}', label: 'Status Name' },
  { token: '{dateOfLoss}', label: 'Date of Loss' },
  { token: '{estimatedLoss}', label: 'Estimated Loss' },
  { token: '{reserve}', label: 'Reserve' },
  { token: '{generatedAt}', label: 'Generated At' },
  { token: '{notes}', label: 'Notes' },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getTemplates();
      setTemplates(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setFile(null);
    setName('');
    setDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('name', name || file.name.replace(/\.docx$/i, ''));
      form.append('description', description);
      form.append('isDefault', 'false');
      await createTemplate(form);
      resetForm();
      await load();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    await deleteTemplate(confirm.id);
    setConfirm(null);
    await load();
  };

  const handleDefault = async (id) => {
    await setDefaultTemplate(id);
    await load();
  };

  const handleDownload = async (id, fileName) => {
    const blob = await downloadTemplate(id);
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `template-${id}.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.docx')) {
      setFile(droppedFile);
      if (!name) setName(droppedFile.name.replace(/\.docx$/i, ''));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const defaultTemplate = templates.find((t) => t.isDefault);
  const activeCount = templates.length;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-[260px]">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-headline-lg font-semibold text-primary">Report Templates</h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Upload and manage DOCX templates used for report generation.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-label-md text-outline uppercase truncate">Total Templates</p>
                <p className="text-headline-sm font-semibold text-on-surface tabular-nums">{activeCount}</p>
              </div>
            </div>
            <div className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 rounded bg-success-green/10 text-success-green flex items-center justify-center shrink-0">
                <Star size={18} className="fill-current" />
              </div>
              <div className="min-w-0">
                <p className="text-label-md text-outline uppercase truncate">Default Template</p>
                <p className="text-headline-sm font-semibold text-on-surface truncate">
                  {defaultTemplate ? defaultTemplate.name : 'Not set'}
                </p>
              </div>
            </div>
            <div className="bg-surface border border-surface-border rounded-lg p-4 flex items-center gap-3">
              <div className="p-2 rounded bg-accent-orange/10 text-accent-orange flex items-center justify-center shrink-0">
                <FileType size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-label-md text-outline uppercase truncate">Format</p>
                <p className="text-headline-sm font-semibold text-on-surface">DOCX</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Card */}
            <section className="bg-surface border border-surface-border rounded-lg shadow-sm flex flex-col">
              <div className="p-6 border-b border-surface-border bg-surface-container-lowest rounded-t-lg">
                <h3 className="text-headline-sm font-semibold text-primary flex items-center gap-2">
                  <Upload size={18} />
                  Upload Template
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 flex flex-col">
                {/* Drag & Drop Zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : file
                        ? 'border-success-green/50 bg-success-green/5'
                        : 'border-outline hover:border-primary hover:bg-surface-container-low'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setFile(f);
                        if (!name) setName(f.name.replace(/\.docx$/i, ''));
                      }
                    }}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-lg bg-success-green/10 text-success-green">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-body-md font-medium text-on-surface">{file.name}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {(file.size / 1024).toFixed(1)} KB · Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 rounded-lg bg-surface-container-high text-outline">
                        <FileUp size={24} />
                      </div>
                      <p className="text-body-md font-medium text-on-surface-variant">
                        Drop DOCX here or click to browse
                      </p>
                      <p className="text-label-sm text-outline">.docx files only</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-body-sm font-semibold mb-1.5">Template Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Standard Adjustment Report"
                    className="w-full h-10 px-3 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-semibold mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of when to use this template..."
                    rows={3}
                    className="w-full px-3 py-2 rounded border border-outline bg-surface text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors resize-none"
                  />
                </div>

                <div className="flex-1" />

                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="h-10 px-4 bg-primary text-white rounded font-medium hover:bg-primary-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload Template
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Templates List + Placeholders */}
            <div className="lg:col-span-2 space-y-6">
              {/* Templates List */}
              <section className="bg-surface border border-surface-border rounded-lg shadow-sm">
                <div className="p-6 border-b border-surface-border bg-surface-container-lowest rounded-t-lg flex justify-between items-center">
                  <h3 className="text-headline-sm font-semibold text-primary">Templates</h3>
                  <span className="text-label-md text-outline uppercase">{activeCount} total</span>
                </div>

                {loading ? (
                  <div className="p-8 text-center">
                    <p className="text-body-md text-on-surface-variant">Loading templates...</p>
                  </div>
                ) : templates.length === 0 ? (
                  <div className="p-12 text-center">
                    <FileText size={40} className="mx-auto text-outline mb-3" />
                    <p className="text-body-md font-medium text-on-surface">No templates yet</p>
                    <p className="text-body-sm text-on-surface-variant mt-1">
                      Upload a DOCX template to get started with report generation.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-border">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 hover:bg-surface-container-low transition-colors flex items-center gap-4"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            t.isDefault ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-outline'
                          }`}
                        >
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-body-md font-medium text-on-surface truncate">{t.name}</p>
                            {t.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-medium bg-primary/10 text-primary shrink-0">
                                <Star size={10} className="fill-current" />
                                Default
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-body-sm text-on-surface-variant truncate mt-0.5">{t.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {t.fileName && (
                              <span className="text-label-sm text-outline font-mono truncate">{t.fileName}</span>
                            )}
                            <span className="text-label-sm text-outline flex items-center gap-1 shrink-0">
                              <Calendar size={10} />
                              {formatDate(t.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDefault(t.id)}
                            className={`p-1.5 rounded transition-colors ${
                              t.isDefault
                                ? 'text-primary cursor-default'
                                : 'text-outline hover:text-primary hover:bg-primary/10'
                            }`}
                            title={t.isDefault ? 'Already default' : 'Set as default'}
                            aria-label={t.isDefault ? 'Default template' : `Set ${t.name} as default`}
                            disabled={t.isDefault}
                          >
                            {t.isDefault ? <Star size={16} className="fill-current" /> : <StarOff size={16} />}
                          </button>
                          <button
                            onClick={() => handleDownload(t.id, t.fileName)}
                            className="p-1.5 text-outline hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title="Download"
                            aria-label={`Download ${t.name}`}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => setConfirm({ id: t.id, name: t.name })}
                            className="p-1.5 text-outline hover:text-error hover:bg-error/10 rounded transition-colors"
                            title="Delete"
                            aria-label={`Delete ${t.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Placeholders Reference */}
              <section className="bg-surface border border-surface-border rounded-lg shadow-sm">
                <div className="p-6 border-b border-surface-border bg-surface-container-lowest rounded-t-lg">
                  <h3 className="text-headline-sm font-semibold text-primary">Available Placeholders</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Use these tokens in your DOCX template. They will be replaced with claim data during report generation.
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PLACEHOLDERS.map((p) => (
                      <div
                        key={p.token}
                        className="flex items-center gap-2 p-2.5 bg-surface-container-low rounded"
                      >
                        <code className="text-body-sm font-mono text-primary font-medium">{p.token}</code>
                        <span className="text-body-sm text-on-surface-variant truncate">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>

          {confirm && (
            <ConfirmDialog
              open={!!confirm}
              onClose={() => setConfirm(null)}
              onConfirm={handleDelete}
              title="Delete template"
              message={`Delete template "${confirm.name}"? This action cannot be undone.`}
              confirmText="Delete"
              danger
            />
          )}
        </main>
      </div>
    </div>
  );
}
